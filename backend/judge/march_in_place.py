import numpy as np
import mediapipe as mp

mp_pose = mp.solutions.pose

def march_in_place_judge(landmarks, last_leg=None):
    l_hip = landmarks[mp_pose.PoseLandmark.LEFT_HIP.value]
    r_hip = landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value]
    l_knee = landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value]
    r_knee = landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value]
    hip_y = (l_hip.y + r_hip.y) / 2
    l_knee_up = hip_y - l_knee.y
    r_knee_up = hip_y - r_knee.y
    threshold = 0.05

    # 判斷這一幀動作&下一步
    if l_knee_up > threshold and r_knee_up < threshold:
        if last_leg != "left":
            # 剛交替，右腳踏步成功
            return {
                "msg": "右腳踏步！做得好！",
                "leg": "left",
                "next_tip": "請換抬左腳"
            }
        else:
            return {
                "msg": "左腳抬著，等待交替",
                "leg": "left",
                "next_tip": "請換抬右腳"
            }
    elif r_knee_up > threshold and l_knee_up < threshold:
        if last_leg != "right":
            # 剛交替，左腳踏步成功
            return {
                "msg": "左腳踏步！做得好！",
                "leg": "right",
                "next_tip": "請換抬右腳"
            }
        else:
            return {
                "msg": "右腳抬著，等待交替",
                "leg": "right",
                "next_tip": "請換抬左腳"
            }
    else:
        # 兩腳都沒抬高，或都抬
        return {
            "msg": "請交替抬腳",
            "leg": last_leg,
            "next_tip": "試著抬高其中一腳"
        }
