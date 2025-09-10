import mediapipe as mp
import math
import numpy as np
from enum import Enum

mp_pose = mp.solutions.pose

class Phase(Enum):
    A = 0  # 後擺
    B = 1  # 前擺
    C = 2  # 擊前

BACK_Y_DIFF    = 0.05
FWD_Y_DIFF     = 0.05
CARRY_Y_TOL    = 0.05
CARRY_X_DIFF   = 0.05
ELBOW_MIN      = 90

def joint_angle(a, b, c):
    v1 = np.array([a.x - b.x, a.y - b.y, a.z - b.z])
    v2 = np.array([c.x - b.x, c.y - b.y, c.z - b.z])
    cos = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-6)
    cos = np.clip(cos, -1, 1)
    return math.degrees(math.acos(cos))

def detect_arm_pose(shoulder, elbow, wrist, dir_sign):
    angle = joint_angle(shoulder, elbow, wrist)
    is_A = (shoulder.y - wrist.y > BACK_Y_DIFF and angle > ELBOW_MIN)
    is_B = (wrist.y - shoulder.y > FWD_Y_DIFF and angle > ELBOW_MIN)
    is_C = (abs(wrist.y - shoulder.y) < CARRY_Y_TOL and
            angle > ELBOW_MIN and
            (wrist.x - elbow.x) * dir_sign > CARRY_X_DIFF)
    return is_A, is_B, is_C, angle

def update_phase(phase, is_A, is_B, is_C):
    if phase == Phase.A and is_A:
        return Phase.B, False
    elif phase == Phase.B and is_B:
        return Phase.C, False
    elif phase == Phase.C and is_C:
        return Phase.A, True
    if (phase == Phase.B and not (is_A or is_B)) or (phase == Phase.C and not (is_B or is_C)):
        return Phase.A, False
    return phase, False

def long_jump_arm_judge(landmarks, selected, phase):
    # 依據 selected（'L' 或 'R'）決定 index
    if selected not in ['L', 'R']:
        return {"feedback": "請舉起一隻手臂並保持2秒", "selected": None, "phase": phase, "counted": False}

    SH, EL, WR = (11, 13, 15) if selected == 'L' else (12, 14, 16)
    dir_sign = 1 if selected == 'L' else -1
    shoulder, elbow, wrist = landmarks[SH], landmarks[EL], landmarks[WR]

    if all(p.visibility > 0.5 for p in [shoulder, elbow, wrist]):
        is_A, is_B, is_C, angle = detect_arm_pose(shoulder, elbow, wrist, dir_sign)
        phase, counted = update_phase(phase, is_A, is_B, is_C)
        feedback = ""
    else:
        counted = False
        feedback = "請正確對準鏡頭"

    return {"feedback": feedback, "selected": selected, "phase": phase, "counted": counted}
