import mediapipe as mp

mp_pose = mp.solutions.pose
HEEL_HIP_THRESH_Y = 0.1
HEEL_HIP_THRESH_X = 0.1

def butt_kick_judge(landmarks, phase=None):
    # 關鍵點 index
    L_HEEL, R_HEEL = 29, 30
    L_HIP, R_HIP   = 23, 24

    keypoints_ok = all(landmarks[i].visibility > 0.6 for i in [L_HEEL, R_HEEL, L_HIP, R_HIP])
    if not keypoints_ok:
        return {"feedback": "偵測點不足，請面對鏡頭", "phase": None, "counted": False}

    lh, rh = landmarks[L_HEEL], landmarks[R_HEEL]
    lhip, rhip = landmarks[L_HIP], landmarks[R_HIP]

    def is_kick(heel, hip):
        return (abs(heel.y - hip.y) < HEEL_HIP_THRESH_Y and
                abs(heel.x - hip.x) < HEEL_HIP_THRESH_X)

    left_kick = is_kick(lh, lhip)
    right_kick = is_kick(rh, rhip)

    feedback = ""
    counted = False

    if phase is None:
        if left_kick:
            phase = 'L'
            feedback = "請換右腳踢臀"
        elif right_kick:
            phase = 'R'
            feedback = "請換左腳踢臀"
        else:
            feedback = "請用腳跟碰觸臀部"
    elif phase == 'L' and right_kick:
        counted = True
        phase = None
        feedback = ""
    elif phase == 'R' and left_kick:
        counted = True
        phase = None
        feedback = ""
    else:
        feedback = "請換"
