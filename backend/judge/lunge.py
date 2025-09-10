import cv2, time, numpy as np, mediapipe as mp
from PIL import Image, ImageDraw, ImageFont
mp_pose = mp.solutions.pose
mp_draw = mp.solutions.drawing_utils
mp_style = mp.solutions.drawing_styles
def calculate_angle(a, b, c):
    a, b, c = np.array(a), np.array(b), np.array(c)
    ba = a - b
    bc = c - b
    cos_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    return np.degrees(np.arccos(np.clip(cos_angle, -1.0, 1.0)))
def lunge_status(lm):
    r_hip = [lm[mp_pose.PoseLandmark.RIGHT_HIP.value].x, lm[mp_pose.PoseLandmark.RIGHT_HIP.value].y]
    r_knee = [lm[mp_pose.PoseLandmark.RIGHT_KNEE.value].x, lm[mp_pose.PoseLandmark.RIGHT_KNEE.value].y]
    r_ankle = [lm[mp_pose.PoseLandmark.RIGHT_ANKLE.value].x, lm[mp_pose.PoseLandmark.RIGHT_ANKLE.value].y]
    r_heel = [lm[mp_pose.PoseLandmark.RIGHT_HEEL.value].x, lm[mp_pose.PoseLandmark.RIGHT_HEEL.value].y]
    r_foot_index = [lm[mp_pose.PoseLandmark.RIGHT_FOOT_INDEX.value].x, lm[mp_pose.PoseLandmark.RIGHT_FOOT_INDEX.value].y]

    l_hip = [lm[mp_pose.PoseLandmark.LEFT_HIP.value].x, lm[mp_pose.PoseLandmark.LEFT_HIP.value].y]
    l_knee = [lm[mp_pose.PoseLandmark.LEFT_KNEE.value].x, lm[mp_pose.PoseLandmark.LEFT_KNEE.value].y]
    l_ankle = [lm[mp_pose.PoseLandmark.LEFT_ANKLE.value].x, lm[mp_pose.PoseLandmark.LEFT_ANKLE.value].y]
    l_heel = [lm[mp_pose.PoseLandmark.LEFT_HEEL.value].x, lm[mp_pose.PoseLandmark.LEFT_HEEL.value].y]
    l_foot_index = [lm[mp_pose.PoseLandmark.LEFT_FOOT_INDEX.value].x, lm[mp_pose.PoseLandmark.LEFT_FOOT_INDEX.value].y]

    right_knee_angle = calculate_angle(r_hip, r_knee, r_ankle)
    left_knee_angle = calculate_angle(l_hip, l_knee, l_ankle)

    hip_center_x = (r_hip[0] + l_hip[0]) / 2
    if abs(r_ankle[0] - hip_center_x) > abs(l_ankle[0] - hip_center_x):
        front_knee_angle = right_knee_angle
        back_knee_angle = left_knee_angle
        front_ankle = r_ankle
        back_ankle = l_ankle
        back_heel = l_heel
        back_foot_index = l_foot_index
    else:
        front_knee_angle = left_knee_angle
        back_knee_angle = right_knee_angle
        front_ankle = l_ankle
        back_ankle = r_ankle
        back_heel = r_heel
        back_foot_index = r_foot_index

    r_shoulder = [lm[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x, lm[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y]
    l_shoulder = [lm[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x, lm[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
    shoulder_center = [(r_shoulder[0]+l_shoulder[0])/2, (r_shoulder[1]+l_shoulder[1])/2]
    vertical = np.array([0, 1])
    body_vec = np.array(shoulder_center) - np.array([hip_center_x, (r_hip[1]+l_hip[1])/2])
    body_cos = np.dot(body_vec, vertical) / (np.linalg.norm(body_vec)*np.linalg.norm(vertical))
    body_angle = np.degrees(np.arccos(np.clip(body_cos, -1.0, 1.0)))

    if front_knee_angle < 70:
        return "前膝太彎"
    if front_knee_angle > 120:
        return "前膝太直"
    if abs(front_ankle[0] - back_ankle[0]) < 0.18:
        return "前後腳距離太近"
    if (back_heel[1] - back_foot_index[1]) < -0.03:
        return "後腳腳跟著地"
    return "正確"

