import numpy as np          # 計算角度用
import mediapipe as mp      # mediapipe landmarks 用

mp_pose = mp.solutions.pose # 取 landmark index 用
def triceps_extension_judge(landmarks, hand=None, state='down'):
    # Mediapipe landmarks index
    L_SHOULDER, R_SHOULDER = 11, 12
    L_ELBOW, R_ELBOW = 13, 14
    L_WRIST, R_WRIST = 15, 16
    NOSE = 0

    # 自動判斷左手還右手（可用前幾幀的結果當預設 hand）
    if hand is None:
        if landmarks[L_WRIST].visibility > 0.6:
            hand = 'L'
        elif landmarks[R_WRIST].visibility > 0.6:
            hand = 'R'
        else:
            return {"feedback": "請舉高手", "hand": None, "state": state, "counted": False}

    # 擷取要用的關鍵點
    shoulder = landmarks[L_SHOULDER] if hand == 'L' else landmarks[R_SHOULDER]
    elbow    = landmarks[L_ELBOW] if hand == 'L' else landmarks[R_ELBOW]
    wrist    = landmarks[L_WRIST] if hand == 'L' else landmarks[R_WRIST]
    nose     = landmarks[NOSE]

    # 計算手肘與頭相對位置
    elbow_behind_head = (elbow.x < nose.x) if hand == 'L' else (elbow.x > nose.x)

    # 計算角度
    def calc_angle(a, b, c):
        a = np.array([a.x, a.y])
        b = np.array([b.x, b.y])
        c = np.array([c.x, c.y])
        ab = a - b
        cb = c - b
        cosine_angle = np.dot(ab, cb) / (np.linalg.norm(ab) * np.linalg.norm(cb))
        angle = np.arccos(np.clip(cosine_angle, -1.0, 1.0))
        return np.degrees(angle)

    angle = calc_angle(shoulder, elbow, wrist)
    diff = elbow.y - wrist.y

    # 判斷狀態流（down→up才+1）
    counted = False
    feedback = ""
    UP_THRESH = 0.05
    DOWN_THRESH = 0.05

    if not elbow_behind_head:
        feedback = "請將手肘移至頭後方"
    elif angle < 60:
        feedback = "請將手臂伸直過頭"
        if state == 'down' and diff > UP_THRESH:
            state = 'up'
            feedback = ""
    elif angle > 160:
        feedback = "請彎曲手肘至頭後"
        if state == 'up' and diff < -DOWN_THRESH:
            counted = True
            state = 'down'
            feedback = ""
    else:
        feedback = "動作中"

    return {"feedback": feedback, "hand": hand, "state": state, "counted": counted}
