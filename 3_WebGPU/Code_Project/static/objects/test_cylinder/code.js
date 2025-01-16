if (obj.data == undefined) {
    obj.data = {};
}
if (obj.data.speedX == undefined) {
    obj.data.speedX = 0.01;
}
if (obj.position[0] >= 10.0) {
    obj.data.speedX = -0.01;
}
if (obj.position[0] <= -4.0) {
    obj.data.speedX = 0.01;
}

obj.position[0] += obj.data.speedX * deltaTime;
return obj;
