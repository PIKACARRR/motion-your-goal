import numpy as np
import mediapipe as mp
from enum import Enum

mp_pose = mp.solutions.pose

class StepState(Enum):
    IDLE = "idle"
    LEFT = "left"
    RIGHT = "right"

def side_step_judge(landmarks, state, last_hip_x, reps):
    L_HIP, R_HIP = 23, 24
    L_ANKLE, R_ANKLE = 27, 28

    hip_x = (landmarks[L_HIP].x + landmarks[R_HIP].x) / 2
    ankle_diff_x = landmarks[R_ANKLE].x - landmarks[L_ANKLE].x

    feedback = ""
    STEP_THRESH = 0.15
    HIP_THRESH = 0.1

    if last_hip_x is None:
        last_hip_x = hip_x

    if abs(ankle_diff_x) < STEP_THRESH / 2 and state != StepState.IDLE:
        state = StepState.IDLE
        reps += 1
        feedback = "+1 側步"
    elif ankle_diff_x > STEP_THRESH and state == StepState.IDLE:
        if abs(hip_x - last_hip_x) > HIP_THRESH:
            state = StepState.RIGHT
        else:
            feedback = "請移動身體重心"
    elif ankle_diff_x < -STEP_THRESH and state == StepState.IDLE:
        if abs(hip_x - last_hip_x) > HIP_THRESH:
            state = StepState.LEFT
        else:
            feedback = "請移動身體重心"
    elif abs(ankle_diff_x) < STEP_THRESH and state == StepState.IDLE:
        feedback = "請加大步伐"

    return state, last_hip_x, reps, feedback
