import numpy as np

def wall_angel_judge(landmarks, state='waiting_W'):
    """
    回傳格式與 triceps_extension_judge 一致：
    {
      "feedback": str,     # 提示訊息（空字串代表正確/無需提示）
      "hand": "both",      # Wall Angel 為雙手動作
      "state": str,        # waiting_W / W / Y
      "counted": bool      # 只有 W→Y 才會 True
    }
    """
    # 需要的關節索引（Mediapipe Pose）
    L_SH, L_EL, L_WR = 11, 13, 15
    R_SH, R_EL, R_WR = 12, 14, 16

    # 能見度檢查
    idxs = [L_SH, L_EL, L_WR, R_SH, R_EL, R_WR]
    if any(landmarks[i].visibility < 0.5 for i in idxs):
        return {"feedback": "偵測不到手臂", "hand": "both", "state": state, "counted": False}

    def xy(idx):
        return np.array([landmarks[idx].x, landmarks[idx].y])

    def angle_deg(s, e, w):
        v1 = xy(s) - xy(e)
        v2 = xy(w) - xy(e)
        cosv = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))
        return np.degrees(np.arccos(np.clip(cosv, -1.0, 1.0)))

    # 計算左右手肘角度、手腕/肩的相對高度（y 越小代表越高）
    l_ang = angle_deg(L_SH, L_EL, L_WR)
    r_ang = angle_deg(R_SH, R_EL, R_WR)
    l_sh_y, l_el_y, l_wr_y = landmarks[L_SH].y, landmarks[L_EL].y, landmarks[L_WR].y
    r_sh_y, r_el_y, r_wr_y = landmarks[R_SH].y, landmarks[R_EL].y, landmarks[R_WR].y

    # 與你原本版本一致的條件（放寬判定標準）
    is_lw = 60 < l_ang < 170  # 放寬角度範圍：70-160 -> 60-170
    is_rw = 60 < r_ang < 170  # 放寬角度範圍：70-160 -> 60-170
    lw_sh = abs(l_wr_y - l_sh_y)
    rw_sh = abs(r_wr_y - r_sh_y)
    l_el_ok = (l_el_y < l_sh_y + 0.35)  # 放寬手肘高度：0.27 -> 0.35
    r_el_ok = (r_el_y < r_sh_y + 0.35)  # 放寬手肘高度：0.27 -> 0.35
    symmetry_ok = abs(l_ang - r_ang) < 40  # 放寬對稱度：30 -> 40

    is_ly = (l_ang > 130) and (l_wr_y < l_sh_y + 0.12)  # 放寬 Y 型條件：140 -> 130, 0.07 -> 0.12
    is_ry = (r_ang > 130) and (r_wr_y < r_sh_y + 0.12)  # 放寬 Y 型條件：140 -> 130, 0.07 -> 0.12

    is_W_ok = (is_lw and is_rw and lw_sh < 0.35 and rw_sh < 0.35 and l_el_ok and r_el_ok and symmetry_ok)  # 放寬手腕高度：0.28 -> 0.35
    is_Y_ok = (is_ly and is_ry and symmetry_ok)

    feedback = ""
    counted = False
    new_state = state

    # 狀態機：waiting_W → W → Y(計數) → waiting_W
    if state == 'waiting_W':
        if is_W_ok:
            new_state = 'W'
            feedback = ""  # 正確就不提示
        else:
            # 組合錯誤訊息（盡量精簡）
            msgs = []
            if not is_rw and not is_ry:
                msgs.append("右手肘角度不正確")
            if not is_lw and not is_ly:
                msgs.append("左手肘角度不正確")
            if rw_sh >= 0.35 and not is_ry:  # 更新錯誤檢查條件：0.28 -> 0.35
                msgs.append("右手腕高度有誤")
            if lw_sh >= 0.35 and not is_ly:  # 更新錯誤檢查條件：0.28 -> 0.35
                msgs.append("左手腕高度有誤")
            if not symmetry_ok:
                msgs.append("左右手臂要對稱")
            feedback = "、".join(msgs) if msgs else "請先擺出 W 型"
    elif state == 'W':
        if is_Y_ok:
            new_state = 'waiting_W'
            counted = True   # 只有 W → Y 成功才 +1
            feedback = ""
        elif is_W_ok:
            new_state = 'W'
            feedback = ""
        else:
            # 從 W 脫離但還沒到 Y，提示往上展
            feedback = "手臂往上伸展成 Y 型"
    else:
        # 若收到未知狀態，重置流程
        new_state = 'waiting_W'
        feedback = "請先擺出 W 型"

    return {
        "feedback": feedback,
        "hand": "both",
        "state": new_state,
        "counted": counted
    }
