import mediapipe as mp

mp_pose = mp.solutions.pose

# 建議全域設定這兩個閾值
OPEN_THRESH = 1.5
CLOSE_THRESH = 1.2

def rhomboid_pull_judge(landmarks, state='closed'):
    # 關鍵點 index
    L_WRIST, R_WRIST = 15, 16
    L_SHOULDER, R_SHOULDER = 11, 12

    keypoints_ok = all(landmarks[i].visibility > 0.6 for i in [L_WRIST, R_WRIST, L_SHOULDER, R_SHOULDER])
    if not keypoints_ok:
        return {"feedback": "偵測點不足，請正對鏡頭", "state": state, "counted": False}

    wrist_dist = abs(landmarks[L_WRIST].x - landmarks[R_WRIST].x)
    shoulder_dist = abs(landmarks[L_SHOULDER].x - landmarks[R_SHOULDER].x)
    ratio = wrist_dist / shoulder_dist if shoulder_dist > 0 else 0

    feedback = ""
    counted = False

    if ratio > OPEN_THRESH and state == 'closed':
        state = 'open'
        feedback = "請慢慢收回雙手"
    elif ratio < CLOSE_THRESH and state == 'open':
        state = 'closed'
        counted = True
        feedback = ""
    elif state == 'closed' and ratio < 1.1:
        feedback = "請向兩側展開雙手"
    elif state == 'open' and ratio > 1.6:
        feedback = "請慢慢收回雙手靠近身體"

    return {"feedback": feedback, "state": state, "counted": counted}
