import mediapipe as mp

mp_pose = mp.solutions.pose

DELTA_Y = 0.05

def double_arm_raise_judge(landmarks, state='down'):
    # 關鍵點 index
    L_WRIST, R_WRIST = 15, 16
    L_SHOULDER, R_SHOULDER = 11, 12

    keypoints_ok = all(landmarks[i].visibility > 0.6 for i in [L_WRIST, R_WRIST, L_SHOULDER, R_SHOULDER])
    if not keypoints_ok:
        return {"feedback": "偵測點不足，請正對鏡頭", "state": state, "counted": False}

    lw, rw = landmarks[L_WRIST], landmarks[R_WRIST]
    ls, rs = landmarks[L_SHOULDER], landmarks[R_SHOULDER]

    both_up = lw.y < ls.y - DELTA_Y and rw.y < rs.y - DELTA_Y
    both_down = lw.y > ls.y + DELTA_Y and rw.y > rs.y + DELTA_Y

    counted = False
    feedback = ""

    if both_up and state == 'down':
        state = 'up'
        feedback = ""
    elif both_down and state == 'up':
        state = 'down'
        counted = True
        feedback = ""
    elif state == 'down' and not both_up:
        feedback = "請雙手平舉與肩齊"
    elif state == 'up' and not both_down:
        feedback = "請放下雙手回原位"

    return {"feedback": feedback, "state": state, "counted": counted}
