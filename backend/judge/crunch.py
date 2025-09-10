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

def crunch_judge(landmarks, state='down'):
    # 只用右側關鍵點（與原腳本一致）
    shoulder = landmarks[12]  # 右肩
    hip      = landmarks[24]  # 右臀
    knee     = landmarks[26]  # 右膝

    crunch_angle = calc_angle(shoulder, hip, knee)
    is_up = crunch_angle < 100
    is_down = crunch_angle > 150

    counted = False
    feedback = ""

    if state == 'down' and is_up:
        state = 'up'
        counted = True
        feedback = ""
    elif state == 'up' and is_down:
        state = 'down'
    elif crunch_angle > 130:
        feedback = '請腹部收緊捲起來'
    elif crunch_angle < 90:
        feedback = '請回到躺下的位置'
    else:
        feedback = ""

    return {
        "state": state,
        "counted": counted,
        "feedback": feedback
    }
