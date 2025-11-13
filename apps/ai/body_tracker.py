"""
MediaPipe Body Tracking
Full body pose detection with camera
"""

import os
import sys

# Fix MediaPipe path issue with Japanese characters
# Convert path separators to forward slashes
venv_path = os.path.dirname(sys.executable)
site_packages = os.path.join(venv_path, 'Lib', 'site-packages')
mediapipe_path = os.path.join(site_packages, 'mediapipe')

# Set environment variable for MediaPipe
os.environ['MEDIAPIPE_DISABLE_GPU'] = '1'

import cv2
import mediapipe as mp
import threading
import time
from pythonosc import udp_client

class BodyTracker:
    def __init__(self, osc_host="127.0.0.1", osc_port=11574):
        # MediaPipe setup
        self.mp_pose = mp.solutions.pose
        self.mp_face_mesh = mp.solutions.face_mesh
        self.mp_drawing = mp.solutions.drawing_utils
        
        # Create Pose with simpler parameters
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            smooth_landmarks=True,
            enable_segmentation=False,
            smooth_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Create FaceMesh for expression tracking
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # OSC client for sending data to Gateway
        self.osc_client = udp_client.SimpleUDPClient(osc_host, osc_port)
        
        # Camera
        self.cap = None
        self.running = False
        self.thread = None
        
        print("✅ BodyTracker initialized")
    
    def start(self, camera_id=0):
        """Start camera and tracking"""
        if self.running:
            print("⚠️ Already running")
            return
        
        self.cap = cv2.VideoCapture(camera_id)
        if not self.cap.isOpened():
            print("❌ Cannot open camera")
            return False
        
        self.running = True
        self.thread = threading.Thread(target=self._tracking_loop, daemon=True)
        self.thread.start()
        
        print(f"🎥 Camera started (ID: {camera_id})")
        return True
    
    def stop(self):
        """Stop tracking"""
        self.running = False
        if self.thread:
            self.thread.join(timeout=2.0)
        if self.cap:
            self.cap.release()
        cv2.destroyAllWindows()
        print("🛑 Camera stopped")
    
    def _tracking_loop(self):
        """Main tracking loop"""
        fps_time = time.time()
        fps_counter = 0
        
        while self.running:
            ret, frame = self.cap.read()
            if not ret:
                print("⚠️ Failed to read frame")
                continue
            
            # Flip horizontally (mirror mode)
            frame = cv2.flip(frame, 1)
            
            # Convert to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Process with MediaPipe Pose
            results_pose = self.pose.process(rgb_frame)
            
            # Process with MediaPipe FaceMesh
            results_face = self.face_mesh.process(rgb_frame)
            
            # Send OSC data
            if results_pose.pose_landmarks:
                self._send_pose_data(results_pose.pose_landmarks)
                
                # Draw landmarks
                self.mp_drawing.draw_landmarks(
                    frame,
                    results_pose.pose_landmarks,
                    self.mp_pose.POSE_CONNECTIONS
                )
            
            # Send face data
            if results_face.multi_face_landmarks:
                self._send_face_data(results_face.multi_face_landmarks[0])
            
            # FPS counter
            fps_counter += 1
            if time.time() - fps_time > 1.0:
                fps = fps_counter / (time.time() - fps_time)
                fps_counter = 0
                fps_time = time.time()
                cv2.putText(frame, f"FPS: {fps:.1f}", (10, 30),
                           cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            
            # Show preview
            cv2.imshow("VRabater Body Tracking", frame)
            
            # Press 'q' to quit
            if cv2.waitKey(1) & 0xFF == ord('q'):
                self.running = False
                break
    
    def _send_pose_data(self, landmarks):
        """Send pose data via OSC"""
        try:
            # Map MediaPipe landmarks to body parts
            landmark_map = {
                'left_shoulder': self.mp_pose.PoseLandmark.LEFT_SHOULDER.value,
                'right_shoulder': self.mp_pose.PoseLandmark.RIGHT_SHOULDER.value,
                'left_elbow': self.mp_pose.PoseLandmark.LEFT_ELBOW.value,
                'right_elbow': self.mp_pose.PoseLandmark.RIGHT_ELBOW.value,
                'left_wrist': self.mp_pose.PoseLandmark.LEFT_WRIST.value,
                'right_wrist': self.mp_pose.PoseLandmark.RIGHT_WRIST.value,
                'left_hip': self.mp_pose.PoseLandmark.LEFT_HIP.value,
                'right_hip': self.mp_pose.PoseLandmark.RIGHT_HIP.value,
                'left_knee': self.mp_pose.PoseLandmark.LEFT_KNEE.value,
                'right_knee': self.mp_pose.PoseLandmark.RIGHT_KNEE.value,
                'left_ankle': self.mp_pose.PoseLandmark.LEFT_ANKLE.value,
                'right_ankle': self.mp_pose.PoseLandmark.RIGHT_ANKLE.value,
            }
            
            # Send each landmark with visibility (confidence)
            for part_name, landmark_id in landmark_map.items():
                lm = landmarks.landmark[landmark_id]
                
                # Send as /body/{part}/{x,y,z,visibility}
                self.osc_client.send_message(f"/body/{part_name}/x", lm.x)
                self.osc_client.send_message(f"/body/{part_name}/y", lm.y)
                self.osc_client.send_message(f"/body/{part_name}/z", lm.z)
                # 信頼度を送信（0-1の範囲、1が最も信頼できる）
                self.osc_client.send_message(f"/body/{part_name}/visibility", lm.visibility)
        
        except Exception as e:
            print(f"⚠️ OSC send error: {e}")
    
    def _send_face_data(self, face_landmarks):
        """Send face expression data via OSC"""
        try:
            # MediaPipe Face Mesh landmark indices
            # 口の開き: 上唇中央(13) と 下唇中央(14) の距離
            upper_lip = face_landmarks.landmark[13]
            lower_lip = face_landmarks.landmark[14]
            mouth_open = abs(upper_lip.y - lower_lip.y) * 10  # スケーリング
            
            # 笑顔: 口角(61, 291) の上昇度合い
            left_mouth_corner = face_landmarks.landmark[61]
            right_mouth_corner = face_landmarks.landmark[291]
            mouth_center_y = (left_mouth_corner.y + right_mouth_corner.y) / 2
            smile = max(0, (0.5 - mouth_center_y) * 5)  # 口角が上がるほど大きい値
            
            # まばたき: 目の開き具合 (左目: 159-145, 右目: 386-374)
            left_eye_top = face_landmarks.landmark[159]
            left_eye_bottom = face_landmarks.landmark[145]
            left_eye_open = abs(left_eye_top.y - left_eye_bottom.y) * 20
            left_blink = max(0, 1 - left_eye_open)  # 閉じているほど1に近い
            
            right_eye_top = face_landmarks.landmark[386]
            right_eye_bottom = face_landmarks.landmark[374]
            right_eye_open = abs(right_eye_top.y - right_eye_bottom.y) * 20
            right_blink = max(0, 1 - right_eye_open)
            
            # OSC送信
            self.osc_client.send_message("/face/mouth_open", float(mouth_open))
            self.osc_client.send_message("/face/smile", float(smile))
            self.osc_client.send_message("/face/blink_left", float(left_blink))
            self.osc_client.send_message("/face/blink_right", float(right_blink))
            
        except Exception as e:
            print(f"⚠️ Face OSC send error: {e}")


if __name__ == "__main__":
    # Test standalone
    tracker = BodyTracker()
    
    if tracker.start():
        print("✅ Tracking started. Press 'q' in camera window to quit.")
        try:
            while tracker.running:
                time.sleep(0.1)
        except KeyboardInterrupt:
            print("\n⚠️ Interrupted")
        finally:
            tracker.stop()
    else:
        print("❌ Failed to start tracking")
