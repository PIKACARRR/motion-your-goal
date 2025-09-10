import numpy as np
import mediapipe as mp

mp_pose = mp.solutions.pose

class AnkleBaseline:
    def __init__(self):
        self.samples = []
        self.baseline = None
    def add(self, y):
        self.samples.append(y)
        if len(self.samples) > 60:
            self.samples.pop(0)
    def get(self):
        if self.samples:
            self.baseline = np.median(self.samples)
        return self.baseline

# 全局baseline物件，每次呼叫這個module不重置
baseline_obj = AnkleBaseline()

def skipping_rope_judge(landmarks, last_state="ground"):
    l_ank = landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value]
    r_ank = landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value]
    ankle_y = (l_ank.y + r_ank.y) / 2

    if last_state == "ground":
        baseline_obj.add(ankle_y)
    base_ankle_y = baseline_obj.get()
    if base_ankle_y is None:
        return last_state, "校正中", False

    jump_threshold = 0.035
    is_jump = (base_ankle_y - ankle_y) > jump_threshold

    status = "在地面"
    counted = False
    if is_jump and last_state == "ground":
        status = "起跳"
        counted = True
        last_state = "air"
    elif not is_jump and last_state == "air":
        status = "落地"
        last_state = "ground"
    elif is_jump:
        status = "跳躍中"
    else:
        status = "在地面"

    return last_state, status, counted
