let obstacles = [];
function setup() {
	createCanvas(windowWidth, windowHeight);
	rectMode(CENTER);


	// boundary = new Boundary;


	robot = new Robot(random(100, windowWidth - 30), random(100, windowHeight - 30));

	obstacles.push(new Obstacle(20,windowHeight/2,10,windowHeight-40));
	obstacles.push(new Obstacle(windowWidth-20,windowHeight/2,10,windowHeight-40));
	obstacles.push(new Obstacle(windowWidth/2,20,windowWidth-40,10));
	obstacles.push(new Obstacle(windowWidth/2,windowHeight-20,windowWidth-40,10));
	let obstaclemaxsize = 50;
	for (let i=0; i<10; i++) {
		let obstacle  = new Obstacle(random(30, windowWidth - 30), random(30, windowHeight - 30), random(0,obstaclemaxsize),random(0,obstaclemaxsize));
		if ( ! obstacle.intersects) {
				obstacles.push(obstacle);
		}

	}

	rot = true;
	pnoise = true;
	mnoise = true;
}

function draw() {

	background(0);
	// boundary.show();
	fill(255);
	stroke(0);
	strokeWeight(1);
	text('Press space to toggle rotation / brake', 40, 40);
	text('Press p to toggle process noise (gaussian, sd 1)', 40, 55);
	text('Press m to toggle measurement noise (gaussian, sd 5)', 40, 70);
	text('Press arrows to add force', 40, 85);


	for (let obstacle of obstacles) {
		obstacle.show();
		obstacle.changeColor(255);
	}
	robot.move();

	// Add process noise
	if (pnoise) {
		robot.addpnoise();
	}


	for (let las of robot.lasers) {
		if (rot) {
			las.rotatelaser(0.01);
		}
		las.testobjects();
		// Add measurement noise
		if (mnoise) {
			las.addmnoise();
		}
	}
	robot.show();
}

function keyTyped() {
	if (key == ' ') {
		rot = !rot;
	}
	if (key == 'p') {
		pnoise = !pnoise;
	}
	if (key == 'm') {
		mnoise = !mnoise;
	}
}

class Obstacle {
	constructor(x_,y_,w_,h_) {
		this.pos = createVector(x_,y_);
		this.size = createVector(w_,h_);

		this.top = this.pos.y-this.size.y/2;
		this.right = this.pos.x+this.size.x/2;
		this.bottom = this.pos.y+this.size.y/2;
		this.left = this.pos.x-this.size.x/2;

		this.color = 255
		this.intersects = false;
		let x_d = abs(this.pos.x - robot.pos.x);
		let y_d = abs(this.pos.y - robot.pos.y);
		if (x_d <= robot.radius + this.size.x/2 && y_d <= robot.radius + this.size.y/2) {
			this.intersects = true;
		}
	}

	show() {
		strokeWeight(0);
		fill(this.color);
		rectMode(CENTER)
		rect(this.pos.x,this.pos.y,this.size.x,this.size.y);
	}
	changeColor(color_) {
		this.color = color_;
	}
	burn(x_,y_, color_) {
		this.color = color_;
		fill(this.color);
		ellipse(x_,y_,10,10);
	}
}
// class Boundary {
// 	constructor() {
// 		this.pos = createVector(windowWidth/2,windowHeight/2);
// 		this.size = createVector(windowWidth-20,windowHeight-20);
// 	}
// 	show() {
// 		strokeWeight(5);
// 		stroke(255,0,0);
// 		noFill();
// 		rect(this.pos.x,this.pos.y,this.size.x,this.size.y);
// 	}
// }

class Laser {
	constructor(parentrobot_,theta_) {
		this.color = [random(0,255),random(0,255),random(0,255)]
		this.theta = theta_;
		this.parentrobot = parentrobot_;
		this.orientation = createVector(cos(this.theta),sin(this.theta));
		this.length = 1000;
		this.collision = createVector(this.parentrobot.pos.x + this.length * this.orientation.x,
			 this.parentrobot.pos.y + this.length * this.orientation.y)
		this.burnedobstacle = null;
	}

	rotatelaser(rotation_) {
		this.theta = this.theta + rotation_;
		this.orientation = createVector(cos(this.theta),sin(this.theta));
		this.collision = createVector(this.parentrobot.pos.x + this.length * this.orientation.x,
			 this.parentrobot.pos.y + this.length * this.orientation.y)
	}

	testobjects() {
		this.length = 1000;
		let m = this.orientation.y/this.orientation.x;
		let c = this.parentrobot.pos.y - m * this.parentrobot.pos.x;
		for (let obstacle of obstacles) {
			// if the laser overlaps the top
			if ((obstacle.top-c)/m > obstacle.left && (obstacle.top-c)/m<obstacle.right) {
				let testcollision = createVector((obstacle.top-c)/m,obstacle.top);
				this.hit(obstacle, testcollision);
			}
			// if the laser overlaps the bottom
			if ((obstacle.bottom-c)/m > obstacle.left && (obstacle.bottom-c)/m<obstacle.right) {
				let testcollision = createVector((obstacle.bottom-c)/m,obstacle.bottom);
				this.hit(obstacle, testcollision);
			}
			// if the laser overlaps the right
			if (m * obstacle.right + c > obstacle.top && m * obstacle.right + c < obstacle.bottom) {
				let testcollision = createVector(obstacle.right,m * obstacle.right + c);
				this.hit(obstacle, testcollision);
			}
			// if the laser overlaps the left
			if (m * obstacle.left + c > obstacle.top && m * obstacle.left + c < obstacle.bottom) {
				let testcollision = createVector(obstacle.left,m * obstacle.left + c);
				this.hit(obstacle, testcollision);
			}

		}
		if (this.burnedobstacle) {
			this.burnedobstacle.burn(this.collision.x,this.collision.y, this.color);

		}
	}

	hit (obstacle_, testcollision_) {
		// if the object is in front of the eye
		if ((this.orientation.x > 0 && testcollision_.x > this.parentrobot.pos.x) || (this.orientation.y > 0 && testcollision_.y > this.parentrobot.pos.y) ||
		(this.orientation.x < 0 && testcollision_.x < this.parentrobot.pos.x) || (this.orientation.y < 0 && testcollision_.y < this.parentrobot.pos.y)) {
			let xdist = testcollision_.x-this.parentrobot.pos.x;
			let ydist = testcollision_.y-this.parentrobot.pos.y;
			let tempdist = sqrt(xdist**2+ydist**2);
			// if this is the first collision or the closest collision seen
			if (tempdist < this.length) {
				this.length = tempdist;
				this.burnedobstacle = obstacle_;
				this.collision = testcollision_;
			}
		}
	}

	addmnoise() {
		this.length = this.length + randomGaussian(0,5);
	}

	show () {
		strokeWeight(0);
		stroke(this.color);
		fill(this.color);
		text(this.length.toFixed(0),this.parentrobot.pos.x + (this.parentrobot.radius + 20) * this.orientation.x, this.parentrobot.pos.y + (this.parentrobot.radius + 20) * this.orientation.y);
		ellipse(this.parentrobot.pos.x + this.parentrobot.radius * this.orientation.x, this.parentrobot.pos.y + this.parentrobot.radius * this.orientation.y, 10, 10);
		strokeWeight(1);
		line(this.parentrobot.pos.x + this.parentrobot.radius * this.orientation.x, this.parentrobot.pos.y + this.parentrobot.radius * this.orientation.y, this.collision.x, this.collision.y)
	}
}

class Robot {
	constructor(x_,y_) {
		this.pos = createVector(x_,y_);
		this.vel = createVector(0,0);
		this.acc = createVector(0,0);
		this.angle = 0;
		this.orientation = createVector(cos(this.angle),sin(this.angle));
		let normalisationconstant = sqrt(this.orientation.x**2+this.orientation.y**2);
		this.orientation.x = this.orientation.x/normalisationconstant;
		this.orientation.y = this.orientation.y/normalisationconstant;
		this.radius = 25;
		this.lasers = [];
		this.lasers.push(new Laser(this, 0));
		this.lasers.push(new Laser(this, PI));
		this.lasers.push(new Laser(this, 7*PI/4));
		this.lasers.push(new Laser(this, PI/4));
	}

	move() {
		//drag
		this.vel.mult(0.99)

		this.acc.x = 0;
		this.acc.y = 0;

		//add force
		if (keyIsDown(LEFT_ARROW)) {
			this.acc.x = - 0.1;
		}
		if (keyIsDown(RIGHT_ARROW)) {
			this.acc.x = 0.1;
		}
		if (keyIsDown(UP_ARROW)) {
			this.acc.y = - 0.1;
		}
		if (keyIsDown(DOWN_ARROW)) {
			this.acc.y = 0.1;
		}
		// halt
		if (keyIsDown (32)) {
			this.vel.x = 0;
			this.vel.y = 0;
		}

		// propagate physics
		this.vel = this.vel.add(this.acc);
		this.pos = this.pos.add(this.vel);

		// check for collisions
		this.collide();
	}

	addpnoise() {
		let angle = random(0,2*PI);
		let movement = createVector(cos(angle),sin(angle));
		let amplitude = randomGaussian(0,1);
		this.pos.x = this.pos.x + amplitude * movement.x;
		this.pos.y = this.pos.y + amplitude * movement.y;
	}


	collide() {
		for (let obstacle of obstacles) {
				let x_d = abs(obstacle.pos.x - this.pos.x);
				let y_d = abs(obstacle.pos.y - this.pos.y);
				if (x_d <= this.radius + obstacle.size.x/2 && y_d <= this.radius+obstacle.size.y/2) {
					this.vel.x = -this.vel.x;
					this.vel.y = -this.vel.y;
				}
				// if (y_d < this.radius+obstacle.size.y/2) {
				// 	this.vel.y = -this.vel.y;
				// }
			}
		// if (this.pos.x - this.radius < boundary.pos.x - boundary.size.x/2 || this.pos.x + this.radius > boundary.pos.x + boundary.size.x/2 ) {
		// 	this.vel.x = - this.vel.x;
		// }
		// if (this.pos.y - this.radius < boundary.pos.y - boundary.size.y/2 || this.pos.y + this.radius > boundary.pos.y + boundary.size.y/2 ) {
		// 	this.vel.y = - this.vel.y;
		// }
	}

	show() {
		strokeWeight(0);
		fill(0,255,0);
		ellipse(this.pos.x, this.pos.y, this.radius*2, this.radius*2);

		//lasers
		for (let las of this.lasers) {
			las.show();
		}
	}
}
