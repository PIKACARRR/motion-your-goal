import mediapipe as mp

mp_pose = mp.solutions.pose

def swimming_judge(landmarks, phase=None):
    # 關鍵點 index
    L_WRIST, R_WRIST = 15, 16
    L_SHOULDER, R_SHOULDER = 11, 12
    THRESH_Y = 0.05

    # 檢查關鍵點是否可見
    keypoints_ok = all(landmarks[i].visibility > 0.6 for i in [L_WRIST, R_WRIST, L_SHOULDER, R_SHOULDER])
    if not keypoints_ok:
        return {"feedback": "偵測點不足，請面對鏡頭", "phase": None, "counted": False}

    lw, rw = landmarks[L_WRIST], landmarks[R_WRIST]
    ls, rs = landmarks[L_SHOULDER], landmarks[R_SHOULDER]
    left_ready = lw.y < ls.y - THRESH_Y
    right_ready = rw.y < rs.y - THRESH_Y

    feedback = ""
    counted = False

    if phase is None:
        if left_ready:
            phase = 'L'
            feedback = "請換右手划手"
        elif right_ready:
            phase = 'R'
            feedback = "請換左手划手"
        else:
            feedback = "請舉起一隻手"
    elif phase == 'L' and right_ready:
        counted = True
        phase = None
        feedback = ""
    elif phase == 'R' and left_ready:
        counted = True
        phase = None
        feedback = ""
    else:
        feedback = "請換另一隻手划手"

    return {"feedback": feedback, "phase": phase, "counted": counted}
