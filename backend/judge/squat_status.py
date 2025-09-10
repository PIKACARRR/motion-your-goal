import mediapipe as mp

mp_pose = mp.solutions.pose

def squat_status_judge(landmarks):
    l_shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value]
    r_shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
    l_hip = landmarks[mp_pose.PoseLandmark.LEFT_HIP.value]
    r_hip = landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value]
    l_knee = landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value]
    r_knee = landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value]
    l_ankle = landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value]
    r_ankle = landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value]
    l_wrist = landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value]
    r_wrist = landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value]
    l_foot_index = landmarks[mp_pose.PoseLandmark.LEFT_FOOT_INDEX.value]
    r_foot_index = landmarks[mp_pose.PoseLandmark.RIGHT_FOOT_INDEX.value]

    hip_y = (l_hip.y + r_hip.y)/2
    knee_y = (l_knee.y + r_knee.y)/2
    ankle_y = (l_ankle.y + r_ankle.y)/2
    foot_dist = abs(l_foot_index.x - r_foot_index.x)
    wrist_y = (l_wrist.y + r_wrist.y)/2
    shoulder_y = (l_shoulder.y + r_shoulder.y)/2

    # 1. 站立
    if knee_y > hip_y + 0.10 and wrist_y > shoulder_y + 0.18:
        return "站立"
    # 2. 深蹲到底
    if (knee_y > hip_y + 0.03 and
        knee_y > ankle_y - 0.25 and
        abs(wrist_y - shoulder_y) < 0.23 and
        foot_dist > 0.11):
        return "深蹲到底，動作正確"
    # 3. 手沒舉好
    if abs(wrist_y - shoulder_y) > 0.10:
        return "手臂沒舉平"
    # 4. 膝未明顯下降
    if knee_y < hip_y - 0.04:
        return "膝蓋未下沉"
    # 5. 雙腳太窄
    if foot_dist < 0.11:
        return "腳開不夠寬"
    return "請再蹲低一點"
