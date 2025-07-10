from flask import Flask, request, jsonify
from flask_cors import CORS
import pymysql
import pymysql.cursors
import cv2
import numpy as np
from datetime import datetime
import dbutils.pooled_db as PooledDB
import insightface
from insightface.app import FaceAnalysis
import os
import uuid

app = Flask(__name__)
CORS(app)

# Database config
db_config = {
    "host": "localhost",
    "user": "root",
    "password": "",
    "database": "my_react_native_app"
}

# Create DB connection pool
try:
    pool = PooledDB.PooledDB(
        creator=pymysql,
        **db_config,
        maxconnections=10
    )
    print("[INFO] Database connection pool created successfully.")
except Exception as e:
    print(f"[ERROR] Failed to create database connection pool: {e}")

def get_db_connection():
    return pool.connection()

# Create unknown_faces directory if not exists
os.makedirs('unknown_faces', exist_ok=True)

# Load InsightFace model
print("[INFO] Loading InsightFace model...")
try:
    face_app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
    face_app.prepare(ctx_id=0)
    print("[INFO] InsightFace model loaded successfully.")
except Exception as e:
    print(f"[ERROR] Failed to load InsightFace model: {e}")

# Initialize database tables
def initialize_database():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS unknown_faces (
                id INT AUTO_INCREMENT PRIMARY KEY,
                image_path VARCHAR(255) NOT NULL,
                detection_time DATETIME NOT NULL,
                location VARCHAR(100),
                processed BOOLEAN DEFAULT FALSE,
                notes TEXT,
                UNIQUE KEY (image_path)
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS violations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id VARCHAR(50) NOT NULL,
                student_name VARCHAR(100) NOT NULL,
                grade_level VARCHAR(20),
                section VARCHAR(50),
                violation_type VARCHAR(100) NOT NULL,
                date DATETIME NOT NULL,
                status VARCHAR(20) DEFAULT 'Pending',
                INDEX (student_id),
                INDEX (date)
            )
        """)
        
        conn.commit()
        print("[INFO] Database tables initialized successfully.")
    except Exception as e:
        print(f"[ERROR] Database initialization failed: {e}")
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

initialize_database()

# Load known faces from database
def load_known_faces():
    conn = None
    cursor = None
    known_faces_list = []
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT name, photo, Grade_level, LRN, section FROM studentd")
        rows = cursor.fetchall()

        for name, photo_blob, grade, lrn, section in rows:
            if not photo_blob:
                continue
            try:
                np_array = np.frombuffer(photo_blob, np.uint8)
                img = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

                if img is None:
                    continue

                faces = face_app.get(img)
                if faces:
                    known_faces_list.append({
                        'name': name,
                        'embedding': faces[0].embedding,
                        'grade': grade,
                        'lrn': lrn,
                        'section': section
                    })
            except Exception as e:
                print(f"[ERROR] Processing photo for {name}: {e}")
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

    print(f"[INFO] Total known faces loaded: {len(known_faces_list)}")
    return known_faces_list

known_faces = load_known_faces()

def detect_uniform_violation(face_region):
    """Detect if student is not wearing proper uniform"""
    try:
        # Convert to HSV color space
        hsv = cv2.cvtColor(face_region, cv2.COLOR_BGR2HSV)
        
        # Define uniform color range (adjust these values for your actual uniform)
        lower_uniform = np.array([20, 50, 50])
        upper_uniform = np.array([30, 255, 255])
        
        # Create mask and calculate coverage
        mask = cv2.inRange(hsv, lower_uniform, upper_uniform)
        uniform_coverage = cv2.countNonZero(mask) / (face_region.size / 3)
        
        # If uniform coverage is less than threshold, it's a violation
        return uniform_coverage < 0.3
    except:
        return False

def detect_earrings(face_region):
    """Detect if student is wearing earrings"""
    try:
        gray = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 100, 200)
        contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        
        # Filter contours that might be earrings
        earring_like = [c for c in contours if 50 < cv2.contourArea(c) < 500]
        return len(earring_like) > 2
    except:
        return False

@app.route('/recognize', methods=['POST'])
def recognize_face():
    if 'image' not in request.files:
        return jsonify({'success': False, 'message': 'No image file provided'}), 400

    try:
        file = request.files['image']
        image_bytes = file.read()
        img = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
        if img is None:
            return jsonify({'success': False, 'message': 'Invalid image'}), 400

        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        faces = face_app.get(img_rgb)

        if not faces:
            return jsonify({'success': False, 'message': 'No faces detected'}), 404

        results = []
        for face in faces:
            best_match = None
            highest_similarity = 0
            violations_detected = []
            
            # Extract face region for uniform/accessory detection
            face_region = img[int(face.bbox[1]):int(face.bbox[3]), 
                            int(face.bbox[0]):int(face.bbox[2])]
            
            # Check for uniform violation
            if detect_uniform_violation(face_region):
                violations_detected.append('Uniform Violation')
                
            # Check for earrings
            if detect_earrings(face_region):
                violations_detected.append('Wearing Earrings')

            for known in known_faces:
                similarity = np.dot(face.embedding, known['embedding']) / (
                    np.linalg.norm(face.embedding) * np.linalg.norm(known['embedding'])
                )
                similarity_percent = float((similarity + 1) / 2 * 100)
                if similarity_percent > highest_similarity and similarity_percent > 60:
                    highest_similarity = similarity_percent
                    best_match = known

            if best_match:
                results.append({
                    'name': best_match['name'],
                    'grade': best_match['grade'],
                    'lrn': best_match['lrn'],
                    'section': best_match['section'],
                    'confidence': highest_similarity,
                    'bbox': [float(x) for x in face.bbox.tolist()],
                    'violations_detected': violations_detected
                })
            else:
                violations_detected.append('No ID/Unknown Person')
                results.append({
                    'name': 'Unknown',
                    'grade': '',
                    'lrn': '',
                    'section': '',
                    'confidence': 0,
                    'bbox': [float(x) for x in face.bbox.tolist()],
                    'violations_detected': violations_detected
                })

        return jsonify({
            'success': True, 
            'faces_detected': len(faces), 
            'recognitions': results
        })

    except Exception as e:
        print(f"[ERROR] Recognition failed: {e}")
        return jsonify({'success': False, 'message': f"Server error: {e}"}), 500

@app.route('/submit_violation', methods=['POST'])
def submit_violation():
    conn = None
    cursor = None
    try:
        if not request.is_json:
            return jsonify({'success': False, 'message': 'Invalid request format'}), 400

        data = request.get_json()
        required_fields = ['student_id', 'student_name', 'violation_type']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'Missing field: {field}'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO violations (
                student_id, student_name, grade_level, section,
                violation_type, date, status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            data['student_id'],
            data.get('student_name', 'Unknown'),
            data.get('grade_level', None),
            data.get('section', None),
            data['violation_type'],
            datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            data.get('status', 'Pending')
        ))
        conn.commit()
        return jsonify({'success': True, 'message': 'Violation recorded', 'violation_id': cursor.lastrowid})

    except pymysql.Error as e:
        if conn: conn.rollback()
        return jsonify({'success': False, 'message': f'DB error: {e}'}), 500
    except Exception as e:
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@app.route('/submit_unknown_violation', methods=['POST'])
def submit_unknown_violation():
    conn = None
    cursor = None
    try:
        file = request.files.get('image')
        if not file:
            return jsonify({'success': False, 'message': 'No image file provided'}), 400

        unique_id = str(uuid.uuid4())[:8]
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"unknown_faces/unknown_{timestamp}_{unique_id}.jpg"
        file.save(filename)

        violation_type = request.form.get('violation_type', 'Unknown Person Detected')
        location = request.form.get('location', 'Camera Scan Point')

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO unknown_faces (image_path, detection_time, location)
            VALUES (%s, %s, %s)
        """, (filename, datetime.now(), location))
        
        cursor.execute("""
            INSERT INTO violations (
                student_id, student_name, violation_type, date, status
            ) VALUES (%s, %s, %s, %s, %s)
        """, (
            'UNKNOWN',
            'Unknown Person',
            violation_type,
            datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'Pending'
        ))
        
        conn.commit()
        return jsonify({'success': True, 'message': 'Unknown face reported'})

    except Exception as e:
        print(f"[ERROR] Unknown face reporting failed: {e}")
        if conn: conn.rollback()
        return jsonify({'success': False, 'message': f'Server error: {e}'}), 500
    finally:
        if 'cursor' in locals() and cursor: cursor.close()
        if 'conn' in locals() and conn: conn.close()

@app.route('/get_violations', methods=['GET'])
def get_violations():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        cursor.execute("""
            SELECT v.*, 
                   CASE 
                       WHEN v.student_id = 'UNKNOWN' THEN NULL
                       ELSE (SELECT photo FROM studentd WHERE LRN = v.student_id LIMIT 1)
                   END as student_photo
            FROM violations v
            ORDER BY date DESC
        """)
        violations = cursor.fetchall()

        for violation in violations:
            if 'date' in violation and isinstance(violation['date'], datetime):
                violation['date'] = violation['date'].isoformat()

        return jsonify({'success': True, 'violations': violations})

    except pymysql.Error as e:
        return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@app.route('/get_unknown_faces', methods=['GET'])
def get_unknown_faces():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        cursor.execute("SELECT * FROM unknown_faces ORDER BY detection_time DESC")
        unknown_faces = cursor.fetchall()

        for face in unknown_faces:
            if 'detection_time' in face and isinstance(face['detection_time'], datetime):
                face['detection_time'] = face['detection_time'].isoformat()

        return jsonify({'success': True, 'unknown_faces': unknown_faces})

    except pymysql.Error as e:
        return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

if __name__ == '__main__':
    print("[INFO] Flask InsightFace server running at http://0.0.0.0:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)