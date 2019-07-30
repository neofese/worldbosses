// https://discordapp.com/oauth2/authorize?client_id=604565399253680138&permissions=39936&scope=bot

var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'

const Discord = require('discord.js');
const Scheduler = require('./scheduler.js').Scheduler;
const events = require('./events.json');

var http = require("http");
 
http.createServer(function(request, response){
    response.end();
}).listen(server_port);

let client = null;

function CreateClient() {
	client = new Discord.Client();
	client.login('NjA0NTY1Mzk5MjUzNjgwMTM4.XTvzxg._iykK2jFn4VoYOdG5pTcir34_Go');
	client.on('message', (message) => {
		if (message.guild == null) {
			if (message.content == '/test') {
			}
		}
	});
}

CreateClient(client);

const tasks = [];
events.forEach((event) => {
	for (let period  of [-60, -30, -10]) {
		let minutes = period;
		minutes += event[2];
		minutes += event[1] * 60;
		minutes += event[0] * 1440;
		
		const eventTime = new Date(new Date(2012, 0, 1).getTime() + minutes * 60000);
		const pattern = `${eventTime.getMinutes()} ${eventTime.getHours()} * * ${eventTime.getDay()} *`;
		tasks.push([pattern, () => {
			if (client && client.status == 0) {
				const message = `${event[3]} через ${Math.abs(period)} минут.`;
				client.guilds.forEach((guild) => {
					const channel = guild.channels.find((channel) => {
						return channel.name.includes('боссы');
					})
					
					if (channel) {
						channel.send(message)
						.catch(() => {});
					}
				});
			}
			else {
				CreateClient();
			}
		}]);
	}
});

const scheduler = Scheduler.create(tasks);
scheduler.setTimezone(180);
scheduler.start();