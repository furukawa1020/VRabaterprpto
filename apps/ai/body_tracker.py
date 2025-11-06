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
            
            # Process with MediaPipe
            results = self.pose.process(rgb_frame)
            
            # Send OSC data
            if results.pose_landmarks:
                self._send_pose_data(results.pose_landmarks)
                
                # Draw landmarks
                self.mp_drawing.draw_landmarks(
                    frame,
                    results.pose_landmarks,
                    self.mp_pose.POSE_CONNECTIONS
                )
            
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
            
            # Send each landmark
            for part_name, landmark_id in landmark_map.items():
                lm = landmarks.landmark[landmark_id]
                
                # Send as /body/{part}/{x,y,z}
                self.osc_client.send_message(f"/body/{part_name}/x", lm.x)
                self.osc_client.send_message(f"/body/{part_name}/y", lm.y)
                self.osc_client.send_message(f"/body/{part_name}/z", lm.z)
        
        except Exception as e:
            print(f"⚠️ OSC send error: {e}")


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
