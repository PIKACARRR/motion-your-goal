import numpy as np
import mediapipe as mp

mp_pose = mp.solutions.pose

def single_leg_judge(landmarks):
    idxs = [23,24,25,26,27,28,11,12]
    if any(landmarks[i].visibility < 0.5 for i in idxs):
        return "偵測不到下肢", None, None

    left_ankle_y = landmarks[27].y
    right_ankle_y = landmarks[28].y

    if left_ankle_y < right_ankle_y - 0.04:
        support_leg = "right"
        raise_ankle, raise_knee = 27, 25
        which_leg = "右腳抬"
    elif right_ankle_y < left_ankle_y - 0.04:
        support_leg = "left"
        raise_ankle, raise_knee = 28, 26
        which_leg = "左腳抬"
    else:
        return "雙腳未明顯抬起，請單腳站立", None, None

    def get_angle(a, b, c):
        a = np.array([landmarks[a].x, landmarks[a].y])
        b = np.array([landmarks[b].x, landmarks[b].y])
        c = np.array([landmarks[c].x, landmarks[c].y])
        ba = a - b
        bc = c - b
        cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
        return np.arccos(np.clip(cosine_angle, -1.0, 1.0)) * 180 / np.pi

    support_hip, support_knee, support_ankle = (24, 26, 28) if support_leg == "right" else (23, 25, 27)
    support_angle = get_angle(support_hip, support_knee, support_ankle)
    raise_height_ok = (landmarks[raise_ankle].y < landmarks[support_ankle].y - 0.03)
    shoulder_y_diff = abs(landmarks[11].y - landmarks[12].y)
    trunk_ok = (shoulder_y_diff < 0.07)
    knee_ankle_xdiff = abs(landmarks[support_knee].x - landmarks[support_ankle].x)
    feet_forward = (knee_ankle_xdiff < 0.08)
    support_ok = support_angle > 160

    tips = []
    if not raise_height_ok:
        tips.append("抬腳高度不夠")
    if not trunk_ok:
        tips.append("軀幹未正直")
    if not feet_forward:
        tips.append("請注意膝蓋腳尖對齊")
    if not support_ok:
        tips.append("支撐腳請伸直")
    if len(tips) == 0:
        action = "單腳站立正確"
    else:
        action = "、".join(tips)

    return action, which_leg, support_leg
