import mediapipe as mp

mp_pose = mp.solutions.pose
def jumping_jack_judge(landmarks, waiting_for_open, waiting_for_close):
    # 篩選主要位置
    l_sh = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value]
    r_sh = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
    l_ank = landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value]
    r_ank = landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value]
    l_wri = landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value]
    r_wri = landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value]

    shoulder_width = abs(l_sh.x - r_sh.x)
    ankle_dist = abs(l_ank.x - r_ank.x)
    wrist_y = (l_wri.y + r_wri.y) / 2
    shoulder_y = (l_sh.y + r_sh.y) / 2

    open_leg = ankle_dist > shoulder_width * 1.2
    open_arm = wrist_y < shoulder_y - 0.05
    close_leg = ankle_dist < shoulder_width * 1.05
    close_arm = wrist_y > shoulder_y + 0.10

    if open_leg and open_arm and not waiting_for_open:
        return "open", True, False
    elif close_leg and close_arm and waiting_for_open:
        return "close", False, True
    elif ankle_dist <= shoulder_width * 1.2:
        return "腿沒開夠", waiting_for_open, waiting_for_close
    elif wrist_y >= shoulder_y - 0.05:
        return "手沒舉過頭", waiting_for_open, waiting_for_close
    else:
        return "動作中", waiting_for_open, waiting_for_close
