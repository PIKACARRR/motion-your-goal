import mediapipe as mp

mp_pose = mp.solutions.pose
UP_THRESH = 0.05
DOWN_THRESH = 0.05

def arm_swing_judge(landmarks, hand=None, state='down'):
    # 初次自動偵測左手/右手（可用於Flask的全域管理hand變數）
    L_SHOULDER, R_SHOULDER = 11, 12
    L_WRIST, R_WRIST = 15, 16

    if hand is None:
        # 只要一隻手明顯即可選定
        if landmarks[L_WRIST].visibility > 0.6:
            hand = 'L'
        elif landmarks[R_WRIST].visibility > 0.6:
            hand = 'R'
        else:
            return {"feedback": "請將手伸出且靠近鏡頭", "hand": None, "state": state, "counted": False}

    # 取關鍵點
    s = landmarks[L_SHOULDER] if hand == 'L' else landmarks[R_SHOULDER]
    w = landmarks[L_WRIST] if hand == 'L' else landmarks[R_WRIST]
    diff = s.y - w.y

    feedback = ""
    counted = False

    if diff > UP_THRESH and state == 'down':
        state = 'up'
        feedback = ""
    elif diff < -DOWN_THRESH and state == 'up':
        state = 'down'
        counted = True
        feedback = ""
    elif diff < 0.02 and state == 'down':
        feedback = '請將手舉高至肩膀上'
    elif diff > -0.02 and state == 'up':
        feedback = '請將手自然放下，手腕要低於肩膀'

    return {"feedback": feedback, "hand": hand, "state": state, "counted": counted}
