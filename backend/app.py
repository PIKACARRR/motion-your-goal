from flask import Flask, Response, jsonify, request
import cv2
import mediapipe as mp
from flask_cors import CORS
# 匯入你寫好的判斷函式
from judge.wall_angel import wall_angel_judge
from judge.march_in_place import march_in_place_judge  
from judge.skipping_rope import skipping_rope_judge
from judge.side_step import side_step_judge,StepState
from judge.jumping_jack import jumping_jack_judge
from judge.lunge import lunge_status
from judge.triceps_extension import triceps_extension_judge
from judge.push_ups import pushup_judge
from judge.front_shoulder_stretch import shoulder_extension_judge
from judge.crunch import crunch_judge
from judge.swimming import swimming_judge
from judge.rhomboid_pull import rhomboid_pull_judge
from judge.butt_kick import butt_kick_judge
from judge.double_arm_raise import double_arm_raise_judge
from judge.long_jump_arm import long_jump_arm_judge,Phase
from judge.arm_swing import arm_swing_judge
from judge.squat_status import squat_status_judge
from judge.single_leg import single_leg_judge

# 導入 Non-stop Jump Rope 模組
import importlib.util
import os
spec = importlib.util.spec_from_file_location(
    "nonstop_jump_rope", 
    os.path.join("judge", "Non-stop Jump Rope.py")
)
nonstop_jump_rope_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(nonstop_jump_rope_module)
nonstop_jump_rope_judge = nonstop_jump_rope_module.nonstop_jump_rope_judge
BaselineTracker = nonstop_jump_rope_module.BaselineTracker
app = Flask(__name__)
CORS(app)
mp_pose = mp.solutions.pose

# ====== 全域變數 ======
latest_result = {"msg": "等待偵測"}
current_sport = "wall_angel"   # 預設運動
last_leg = None                # 提膝專用
march_count = 0                # 提膝專用
last_state = "ground"
skip_count = 0
side_step_state = StepState.IDLE
side_step_last_hip_x = None
side_step_reps = 0
waiting_for_open = False
waiting_for_close = False
count = 0
triceps_hand = None
triceps_state = 'down'
triceps_count = 0
pushup_state = "up"
pushup_count = 0
shoulder_hand = None
shoulder_state = 'ready'
shoulder_count = 0
crunch_state = 'down'
crunch_count = 0
swim_phase = None
swim_count = 0
rhomboid_state = 'closed'
rhomboid_count = 0
buttkick_phase = None
buttkick_count = 0
double_raise_state = 'down'
double_raise_count = 0
longjump_selected = None
longjump_phase = Phase.A
longjump_count = 0
arm_hand = None
arm_state = 'down'
arm_count = 0
squat_waiting_for_up = False
squat_count = 0
singleleg_in = False
singleleg_start = None
singleleg_duration = 0
singleleg_best = 0
singleleg_msg = ""

# Wall Angel 相關變數
wall_angel_state = 'waiting_W'
wall_angel_count = 0

# Non-stop Jump Rope 相關變數
nonstop_jump_rope_state = "ground"
nonstop_jump_rope_count = 0
nonstop_jump_rope_baseline = None

# ====== 運動切換 API，切換時自動重置狀態 ======
@app.route('/api/set_sport', methods=['POST'])
def set_sport():
    global current_sport, last_leg, march_count, last_state, skip_count, side_step_state, side_step_last_hip_x
    global side_step_reps,waiting_for_open, waiting_for_close, count, latest_result,jump_count,waiting_for_lunge_down, lunge_count,triceps_hand,triceps_count,triceps_state,pushup_state,pushup_count,shoulder_hand,shoulder_state,shoulder_count
    global crunch_state,crunch_count,swim_phase,swim_count,rhomboid_count,rhomboid_state,buttkick_count,buttkick_phase,double_raise_state,double_raise_count,longjump_selected,longjump_phase,longjump_count
    global arm_hand,arm_count,arm_state,squat_status,squat_waiting_for_up,singleleg_in,singleleg_start,singleleg_duration,singleleg_best,singleleg_msg
    global wall_angel_state, wall_angel_count
    global nonstop_jump_rope_state, nonstop_jump_rope_count, nonstop_jump_rope_baseline
    data = request.get_json()
    current_sport = data.get('sport', 'wall_angel')
    last_leg = None
    march_count = 0
    last_state = "ground"
    skip_count = 0
    side_step_state = StepState.IDLE
    side_step_last_hip_x = None
    side_step_reps = 0
    waiting_for_open = False
    waiting_for_close = False
    jump_count = 0
    waiting_for_lunge_down = False
    lunge_count = 0
    triceps_hand = None
    triceps_state = 'down'
    triceps_count = 0
    pushup_state = "up"
    pushup_count = 0
    shoulder_hand = None
    shoulder_state = 'ready'
    shoulder_count = 0
    crunch_state = 'down'
    crunch_count = 0
    swim_phase = None
    swim_count = 0
    rhomboid_state = 'closed'
    rhomboid_count = 0
    buttkick_phase = None
    buttkick_count = 0
    double_raise_state = 'down'
    double_raise_count = 0
    longjump_selected = None
    longjump_phase = Phase.A
    longjump_count = 0
    arm_hand = None
    arm_state = 'down'
    arm_count = 0
    squat_waiting_for_up = False
    squat_count = 0
    singleleg_in = False
    singleleg_start = None
    singleleg_duration = 0
    singleleg_best = 0
    singleleg_msg = ""
    wall_angel_state = 'waiting_W'
    wall_angel_count = 0
    nonstop_jump_rope_state = "ground"
    nonstop_jump_rope_count = 0
    nonstop_jump_rope_baseline = BaselineTracker()
    return {"status": "ok", "sport": current_sport}

# ====== MJPEG 產生器 ======
def gen_frames():
    global current_sport, last_leg, march_count, last_state, skip_count, side_step_state, side_step_last_hip_x
    global side_step_reps, waiting_for_open, waiting_for_close, count, jump_count, latest_result,waiting_for_lunge_down, lunge_count,triceps_hand,triceps_count,triceps_state
    global pushup_state,pushup_count,shoulder_hand,shoulder_state,shoulder_count,crunch_count,crunch_state,swim_phase,swim_count,rhomboid_count,rhomboid_state,buttkick_count,buttkick_phase
    global double_raise_state,double_raise_count,longjump_selected,longjump_phase,longjump_count,arm_count,arm_state,arm_hand,squat_count,squat_waiting_for_up,singleleg_in,singleleg_start,singleleg_duration,singleleg_best,singleleg_msg
    global wall_angel_state, wall_angel_count
    global nonstop_jump_rope_state, nonstop_jump_rope_count, nonstop_jump_rope_baseline
    cap = cv2.VideoCapture(0)
    with mp_pose.Pose(model_complexity=1, min_detection_confidence=0.7, min_tracking_confidence=0.7) as pose:
        while True:
            success, frame = cap.read()
            if not success:
                continue
            
            # 鏡像翻轉（水平翻轉）
            frame = cv2.flip(frame, 1)
            
            img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = pose.process(img_rgb)
            if results.pose_landmarks:
                if current_sport == "wall_angel":
                    result = wall_angel_judge(results.pose_landmarks.landmark, state=wall_angel_state)
                    wall_angel_state = result["state"]
                    if result["counted"]:
                        wall_angel_count += 1
                    latest_result = {
                        "msg": result["feedback"],
                        "sport": current_sport,
                        "state": result["state"],
                        "counted": result["counted"],
                        "count": wall_angel_count
                    }
                elif current_sport == "march_in_place":
                    result = march_in_place_judge(results.pose_landmarks.landmark, last_leg)
                    msg = result["msg"]
                    if (msg == "左腳踏步" or msg == "右腳踏步") and last_leg != result["leg"]:
                        march_count += 1
                    last_leg = result["leg"]
                    latest_result = {"msg": msg, "count": march_count, "sport": current_sport}
                elif current_sport == "skipping_rope":
                    last_state, status, counted = skipping_rope_judge(results.pose_landmarks.landmark, last_state)
                    if counted:
                        skip_count += 1
                    latest_result = {"msg": status, "count": skip_count, "sport": current_sport}
                elif current_sport == "side_step":
                    side_step_state, side_step_last_hip_x, side_step_reps, feedback = side_step_judge(
                        results.pose_landmarks.landmark,
                        side_step_state,
                        side_step_last_hip_x,
                        side_step_reps
                    )
                    latest_result = {
                        "msg": feedback,
                        "count": side_step_reps,
                        "sport": current_sport
                    }
                elif current_sport == "jumping_jack":
                    status, waiting_for_open, waiting_for_close = jumping_jack_judge(
                        results.pose_landmarks.landmark,
                        waiting_for_open,
                        waiting_for_close
                    )                        
                    if status == "close" and waiting_for_close:
                        jump_count += 1
                    latest_result = {"msg": status, "count": jump_count, "sport": current_sport}                
                elif current_sport == "lunge":
                    status = lunge_status(results.pose_landmarks.landmark)
                    if status == "正確" and not waiting_for_lunge_down:
                        waiting_for_lunge_down = True
                        waiting_for_lunge_up = False
                    elif status != "正確" and waiting_for_lunge_down and status != "未偵測":
                        lunge_count += 1
                        waiting_for_lunge_up = True
                        waiting_for_lunge_down = False
                    latest_result = {"msg": status, "count": lunge_count, "sport": current_sport}
                elif current_sport == "triceps_extension":
                    result = triceps_extension_judge(results.pose_landmarks.landmark, triceps_hand, triceps_state)
                    triceps_hand = result["hand"]
                    triceps_state = result["state"]
                    if result["counted"]:
                        triceps_count += 1
                    latest_result = {
                        "msg": result["feedback"],
                        "count": triceps_count,
                        "sport": current_sport
                    }
                elif current_sport == "push_up":
                    result = pushup_judge(results.pose_landmarks.landmark, pushup_state)
                    pushup_state = result["state"]
                    if result["counted"]:
                        pushup_count += 1
                    latest_result = {
                        "msg": result["feedback"],
                        "count": pushup_count,
                        "sport": current_sport
                    }
                elif current_sport == "front_shoulder_stretch":
                    result = shoulder_extension_judge(results.pose_landmarks.landmark, shoulder_hand, shoulder_state)
                    shoulder_hand = result["hand"]
                    shoulder_state = result["state"]
                    if result["counted"]:
                        shoulder_count += 1
                    latest_result = {
                        "msg": result["feedback"],
                        "count": shoulder_count,
                        "sport": current_sport
                    }
                elif current_sport == "crunch":
                    result = crunch_judge(results.pose_landmarks.landmark, crunch_state)
                    crunch_state = result["state"]
                    if result["counted"]:
                        crunch_count += 1
                    latest_result = {
                        "msg": result["feedback"],
                        "count": crunch_count,
                        "sport": current_sport
                    }
                elif current_sport == "swimming":
                    result = swimming_judge(results.pose_landmarks.landmark, swim_phase)
                    swim_phase = result["phase"]
                    if result["counted"]:
                        swim_count += 1
                    latest_result = {
                        "msg": result["feedback"],
                        "count": swim_count,
                        "sport": current_sport
                    }
                elif current_sport == "rhomboid_pull":
                    result = rhomboid_pull_judge(results.pose_landmarks.landmark, rhomboid_state)
                    rhomboid_state = result["state"]
                    if result["counted"]:
                        rhomboid_count += 1
                    latest_result = {
                        "msg": result["feedback"],
                        "count": rhomboid_count,
                        "sport": current_sport
                    }
                elif current_sport == "butt_kick":
                    result = butt_kick_judge(results.pose_landmarks.landmark, buttkick_phase)
                    buttkick_phase = result["phase"]
                    if result["counted"]:
                        buttkick_count += 1
                    latest_result = {
                        "msg": result["feedback"],
                        "count": buttkick_count,
                        "sport": current_sport
                    }
                elif current_sport == "double_arm_raise":
                    result = double_arm_raise_judge(results.pose_landmarks.landmark, double_raise_state)
                    double_raise_state = result["state"]
                    if result["counted"]:
                        double_raise_count += 1
                    latest_result = {
                        "msg": result["feedback"],
                        "count": double_raise_count,
                        "sport": current_sport
                    }
                elif current_sport == "long_jump_arm":
                    result = long_jump_arm_judge(results.pose_landmarks.landmark, longjump_selected, longjump_phase)
                    longjump_selected = result["selected"]
                    longjump_phase = result["phase"]
                    if result["counted"]:
                        longjump_count += 1
                    latest_result = {
                        "msg": result["feedback"],
                        "count": longjump_count,
                        "sport": current_sport
                    }
                elif current_sport == "arm_swing":
                    result = arm_swing_judge(results.pose_landmarks.landmark, arm_hand, arm_state)
                    arm_hand = result["hand"]
                    arm_state = result["state"]
                    if result["counted"]:
                        arm_count += 1
                    latest_result = {
                        "msg": result["feedback"],
                        "count": arm_count,
                        "sport": current_sport
                    }
                elif current_sport == "squat_status":
                    status = squat_status_judge(results.pose_landmarks.landmark)
                    if "深蹲到底" in status:
                        squat_waiting_for_up = True
                    elif status == "站立" and squat_waiting_for_up:
                        squat_count += 1
                        squat_waiting_for_up = False
                    latest_result = {
                        "msg": status,
                        "count": squat_count,
                        "sport": current_sport
                    }
                elif current_sport == "single_leg_deadlift":
                    action, which_leg, support_leg = single_leg_judge(results.pose_landmarks.landmark)
                    import time
                    if action == "單腳站立正確":
                        if not singleleg_in:
                            singleleg_start = time.time()
                            singleleg_in = True
                        singleleg_duration = time.time() - singleleg_start
                        singleleg_msg = f"持續：{singleleg_duration:.1f} 秒"
                    else:
                        if singleleg_in:
                            # 本次結束，記錄最長
                            singleleg_best = max(singleleg_best, singleleg_duration)
                            singleleg_duration = 0
                            singleleg_in = False
                        singleleg_start = None
                        singleleg_msg = f"最佳：{singleleg_best:.1f} 秒"
                    latest_result = {
                        "msg": action,
                        "which_leg": which_leg,
                        "support_leg": support_leg,
                        "duration": singleleg_duration,
                        "best": singleleg_best,
                        "hint": singleleg_msg,
                        "sport": current_sport
                    }
                elif current_sport == "nonstop_jump_rope":
                    if nonstop_jump_rope_baseline is None:
                        nonstop_jump_rope_baseline = BaselineTracker()
                    
                    result = nonstop_jump_rope_judge(
                        results.pose_landmarks.landmark, 
                        nonstop_jump_rope_state, 
                        nonstop_jump_rope_baseline
                    )
                    nonstop_jump_rope_state = result["state"]
                    nonstop_jump_rope_baseline = result["baseline_obj"]
                    if result["counted"]:
                        nonstop_jump_rope_count += 1
                    
                    latest_result = {
                        "msg": result["feedback"],
                        "count": nonstop_jump_rope_count,
                        "sport": current_sport,
                        "state": result["state"]
                    }
            else:
                latest_result = {"msg": "偵測不到人體", "sport": current_sport}
            #--- MJPEG 串流 ---
            frame = cv2.resize(frame, (640, 480))
            ret, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 60])
            frame = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

# ====== MJPEG 路徑 ======
@app.route('/video_feed')
def video_feed():
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

# ====== 運動判斷狀態 API ======
@app.route('/api/sport_status')
def sport_status():
    return jsonify(latest_result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
