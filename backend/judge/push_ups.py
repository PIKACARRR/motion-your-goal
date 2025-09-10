import numpy as np
import mediapipe as mp

mp_pose = mp.solutions.pose

def calc_angle(a, b, c):
    a = np.array([a.x, a.y])
    b = np.array([b.x, b.y])
    c = np.array([c.x, c.y])
    ab = a - b
    cb = c - b
    cosine_angle = np.dot(ab, cb) / (np.linalg.norm(ab) * np.linalg.norm(cb))
    angle = np.arccos(np.clip(cosine_angle, -1.0, 1.0))
    return np.degrees(angle)

def pushup_judge(landmarks, state="up"):
    # 只用右側關鍵點（你可改成平均或自動偵測較明顯那邊）
    shoulder = landmarks[12]  # 右肩
    elbow    = landmarks[14]  # 右肘
    wrist    = landmarks[16]  # 右腕
    hip      = landmarks[24]  # 右臀
    knee     = landmarks[26]  # 右膝

    arm_angle = calc_angle(shoulder, elbow, wrist)
    body_angle = calc_angle(shoulder, hip, knee)

    low_enough = shoulder.y - wrist.y < 0.05
    straight_body = body_angle > 160

    feedback = ""
    counted = False

    # 流程判斷
    if state == "up" and low_enough and straight_body:
        state = "down"
        feedback = ""
    elif state == "down" and arm_angle > 160 and straight_body:
        state = "up"
        feedback = ""
        counted = True
    elif not straight_body:
        feedback = "請保持身體打直"
    elif not low_enough and state == "up":
        feedback = "請身體向下壓低至接近手肘"

    return {
        "state": state,
        "counted": counted,
        "feedback": feedback
    }
