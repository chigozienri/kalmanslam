# kalmanslam
A simulated playground for exploring Kalman Filtering and SLAM

If you know a robot's initial position, and the instructions you are giving it, you should be able to predict its location at a later time. However, things can interfere with the robot perfectly executing the task (there might be a gust of wind, or the wheels might slip etc.) This is called process noise. Over time, you have less and less confidence in the robot's position.
You can try to fix this by using sensors on your robot which can give updates about its current position. However, these might be noisy themselves (measurement noise). Also, your sensors might not give full information about your environment (for example, it might be a laser that only gives the distance to the closest wall).
A Kalman Filter is one common way of working out how much to trust your model of where you are vs where your sensors are telling you you are. It can be extended to solve the problem of Simultaneous Localization and Mapping (SLAM), building a map of the environment while also working out your position in it.

This is a playground which has a robot which knows the distances to various obstacles using a laser. It is intended to try out Kalman Filtering algorithms.

Try at https://chigozienri.github.io/kalmanslam/
