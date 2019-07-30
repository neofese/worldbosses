const Index = {
	MINUTE: 0, HOUR: 1, DAY: 2, MONTH: 3, DOW: 4, YEAR: 5
};

const Limits = [
	[0, 59], [0, 23], [1, 31], [1, 12], [0, 6], [1900, 3000]
];

const DateUtils = function() {}

DateUtils.getDateUnits = function(date) {
	return [
		date.getMinutes(), date.getHours(), date.getDate(), date.getMonth(), date.getDay(), date.getFullYear()
	];
}

DateUtils.setTimezone = function(date, timezone) {
	return new Date(date.getTime() + (date.getTimezoneOffset() + timezone) * 60000);
}

const TimePattern = function() {
	this.pattern = new Array(6).fill('*');
}

TimePattern.prototype.setPattern = function(value) {
	value.split(' ').forEach((unit, index) => {
		if (index < this.pattern.length) {
			this.pattern[index] = unit;
		}
	});
}

TimePattern.prototype.match = function(time) {
	let result = true;
	DateUtils.getDateUnits(time).forEach((unit, index) => {
		if (this.pattern[index] != '*' && result) {
			let match = false;
			this.getUnitRange(index).forEach((value) => {
				if (value < 0) {
					if (unit % Math.abs(value) == 0) {
						match = true;
					}
				}
				else {
					if (value == unit) {
						match = true;
					}
				}
			});

			result &= match;
		}
	});

	return result;
}

TimePattern.prototype.getUnitRange = function(unitIndex) {
	const rules = [
		[/^\d+$/, (unit) => {
			return [Number(unit)];
		}],
		[/^\*\/\d+$/, (unit) => {
			return [-Number(unit.slice(2))];
		}],
		[/^\d+-\d+$/, (unit) => {
			const [start, end] = unit.split('-').map((value) => { return Number(value); });
			return [...Array(end - start + 1).keys()].map((value) => { return value + start; });
		}],
		[/^[,0-9]+$/, (unit) => {
			return unit.split(',').map((value) => { return Number(value); });
		}],
	];

	for (let rule of rules) {
		const unit = this.pattern[unitIndex];
		if (rule[0].test(unit)) {
			return rule[1](unit).map((value) => {
				const [min, max] = Limits[unitIndex];
				return Math.min(Math.max(Math.abs(value), min), max) * (value < 0 ? -1 : 1);
			});
		}
	}

	return [];
}

const Task = function(pattern, handler) {
	this.pattern = new TimePattern();
	this.pattern.setPattern(pattern);

	this.handler = handler;
}

Task.prototype.run = function() {
	this.handler();
}

Task.prototype.getTimePattern = function() {
	return this.pattern;
}

const Scheduler = function() {
	this.tasks = [];
	this.intervalId = null;

	this.setTimezone(0);
	this.setCurrentTime(new Date());
}

Scheduler.create = function(tasks) {
	const instance = new Scheduler();
	
	tasks.forEach(task => {
		instance.addTask(new Task(task[0], task[1]));
	});

	return instance;
}

Scheduler.prototype.setTimezone = function(value) {
	this.timezone = value;
}

Scheduler.prototype.setCurrentTime = function(value) {
	this.currentTime = DateUtils.setTimezone(new Date(value), this.timezone);
}

Scheduler.prototype.start = function() {
	this.intervalId = setInterval(() => {
		this.setCurrentTime(new Date());
		this.tryToRunTasks();
	}, 1000 * 60);
}

Scheduler.prototype.stop = function() {
	clearInterval(this.intervalId);
}

Scheduler.prototype.addTask = function(task) {
	this.tasks.push(task);
}

Scheduler.prototype.tryToRunTasks = function() {
	this.tasks.forEach((task) => {
		if (task.getTimePattern().match(this.currentTime)) {
			task.run();
		}
	});
}

module.exports.Index = Index;
module.exports.Limits = Limits;
module.exports.DateUtils = DateUtils;
module.exports.TaskTime = TimePattern;
module.exports.Task = Task;
module.exports.Scheduler = Scheduler;