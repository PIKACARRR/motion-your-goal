import mediapipe as mp

mp_pose = mp.solutions.pose

class BaselineTracker:
    """追蹤基準線的類別"""
    def __init__(self, window_size=10):
        self.values = []
        self.window_size = window_size
    
    def add(self, value):
        self.values.append(value)
        if len(self.values) > self.window_size:
            self.values.pop(0)
    
    def get(self):
        if len(self.values) < 5:  # 至少需要5個數據點
            return None
        return sum(self.values) / len(self.values)

def nonstop_jump_rope_judge(landmarks, last_state="ground", baseline_obj=None):
    """
    不停跳繩判斷函數
    參數：
    - landmarks: mediapipe pose landmarks
    - last_state: 上一次的狀態 ("ground" 或 "air")
    - baseline_obj: 基準線追蹤物件
    
    返回格式：
    {
      "feedback": str,     # 提示訊息
      "state": str,        # 當前狀態
      "counted": bool      # 是否計數
    }
    """
    if baseline_obj is None:
        baseline_obj = BaselineTracker()
    
    # 檢查關鍵點可見度
    left_ankle_idx = mp_pose.PoseLandmark.LEFT_ANKLE.value
    right_ankle_idx = mp_pose.PoseLandmark.RIGHT_ANKLE.value
    
    if (landmarks[left_ankle_idx].visibility < 0.5 or 
        landmarks[right_ankle_idx].visibility < 0.5):
        return {
            "feedback": "偵測不到腳踝位置",
            "state": last_state,
            "counted": False,
            "baseline_obj": baseline_obj
        }
    
    l_ank = landmarks[left_ankle_idx]
    r_ank = landmarks[right_ankle_idx]
    ankle_y = (l_ank.y + r_ank.y) / 2

    # 只有在落地且沒跳時才更新基準
    if last_state == "ground":
        baseline_obj.add(ankle_y)
    base_ankle_y = baseline_obj.get()
    if base_ankle_y is None:
        return {
            "feedback": "校正中",
            "state": last_state,
            "counted": False,
            "baseline_obj": baseline_obj
        }

    jump_threshold = 0.035  # 跳躍門檻
    is_jump = (base_ankle_y - ankle_y) > jump_threshold

    feedback = "在地面"
    counted = False
    new_state = last_state
    
    if is_jump and last_state == "ground":
        feedback = "起跳"
        counted = True
        new_state = "air"
    elif not is_jump and last_state == "air":
        feedback = "落地"
        new_state = "ground"
    elif is_jump:
        feedback = "跳躍中"
    else:
        feedback = "在地面"
    
    return {
        "feedback": feedback,
        "state": new_state,
        "counted": counted,
        "baseline_obj": baseline_obj
    }