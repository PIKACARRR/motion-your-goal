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

def shoulder_extension_judge(landmarks, hand=None, state='ready'):
    L_SHOULDER, R_SHOULDER = 11, 12
    L_ELBOW, R_ELBOW = 13, 14
    L_WRIST, R_WRIST = 15, 16

    # 自動決定用哪隻手（只要其中一隻手夠明顯即可）
    if hand is None:
        if landmarks[L_WRIST].visibility > 0.6:
            hand = 'L'
        elif landmarks[R_WRIST].visibility > 0.6:
            hand = 'R'
        else:
            return {"feedback": "請將手舉高", "hand": None, "state": state, "counted": False}

    # 取關鍵點
    shoulder = landmarks[L_SHOULDER] if hand == 'L' else landmarks[R_SHOULDER]
    elbow    = landmarks[L_ELBOW] if hand == 'L' else landmarks[R_ELBOW]
    wrist    = landmarks[L_WRIST] if hand == 'L' else landmarks[R_WRIST]

    angle = calc_angle(shoulder, elbow, wrist)
    backward = wrist.x > shoulder.x if hand == 'L' else wrist.x < shoulder.x
    level = abs(wrist.y - shoulder.y) < 0.1

    counted = False
    feedback = ""

    # down -> up 流程（state="ready"為可以觸發計數）
    if state == 'ready' and backward and level and angle > 150:
        state = 'cooldown'
        counted = True
        feedback = ""
    elif not (backward and level):
        feedback = '請將手臂往後拉並抬高'
        state = 'ready'
    elif angle < 150:
        feedback = '請將手臂完全伸直'
        state = 'ready'
    else:
        feedback = ""

    if state == 'cooldown' and not (backward and level):
        state = 'ready'

    return {"feedback": feedback, "hand": hand, "state": state, "counted": counted}
