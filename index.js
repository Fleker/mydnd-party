var express = require('express');
var pg = require('pg');
var bodyParser = require('body-parser');
var ip = require('ip');

var app = express();
app.set('port', (process.env.PORT || 5000));

function mysql_validate(str) {
    if(str != undefined) {
        return str.replace(/[;]/g, "")
            .replace(/[']/g, "&#39;")
            .replace(/["]/g, "&quot;");
    } 
    return "";
}
function key_validate(str) {
    if(str != undefined) {
        return str.replace(/[\W0-9]/g, "");   
    }
    return "";
}
function url_validate(str) {
    if(str != undefined) {
        return str.replace(/["';]/g, "");   
    }
    return "";
}
function number_validate(int) {
    if(int != undefined) {
        return int.replace(/[\D]/g, "");   
    }
    return "";
}

app.use(express.static(__dirname + '/public'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Index
app.get('/', function(request, response) {
    response.render('pages/index');
    return;
});

// Add new resource
app.get('/add', function(request, response) {
    response.render('pages/add');
    return;
});

// Campaign shortlink
app.get('/campaign', function(request, response) {
    response.render('pages/campaign');
    return;
});

// Search results
app.get('/search', function(request, response) {
    response.render('pages/search');
    return;
});

// API
// Get campaign & all campaigns
//?name=<CAMPAIGN_NAME>
app.get('/api/v1/campaigns', function(request, response) {
    name = mysql_validate(request.params.name) || "";
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        console.log("select * from user_redirects WHERE campaign LIKE '%"+name+"'%");
        client.query("select * from user_redirects WHERE campaign LIKE '%"+name+"%'", function(err, res) {
            console.error(err);
            response.send({results: res.rows, err: err});
        });
    }); 
});
// Add campaign
//name = <CAMPAIGN NAME>, url = <CAMPAIGN_URL>
app.post('/api/v1/campaigns', function(request, response) {
    var campaignName = key_validate(request.body.name);
    var url = url_validate(request.body.url);
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        client.query("insert into user_redirects (campaign, url) values ('"+campaignName+"', '"+url+"')", function(err, res) {
            response.send({res: 200, err: err});
        });
    });     
});
// Get resource & all resources w/ filtering
//?tag=<TAGS>&category=<CATEGORIES>&name=<NAME>
app.get('/api/v1/resources', function(request, response) {
    tag = mysql_validate(request.params.tag) || "";
    category = mysql_validate(request.params.category) || "";
    name = mysql_validate(request.params.name) || "";
    console.log(process.env.DATABASE_URL);
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        console.log(client, err);
        console.log("select * from resources WHERE tags LIKE '%"+tag+"%' OR categories LIKE '%"+category+"%' OR title LIKE '%"+name+"%' ORDER BY clicks DESC");
        client.query("select * from resources WHERE tags LIKE '%"+tag+"%' OR categories LIKE '%"+category+"%' OR title LIKE '%"+name+"%' ORDER BY clicks DESC", function(err, res) {
            console.error(err);
            console.log(res);
            response.send({results: res.rows, err: err});
        });
    }); 
});
// Add resource
//title = <TITLE>, description = <DESCRIPTION>, url = <URL>, tags = <TAGS>, categories = <CATEGORY>, submitted = <timestamp>
app.post('/api/v1/resources', function(request, response) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        console.log("insert into resources (title, description, url, tags, categories, submitted, clicks) values ('"+request.body.title+"', '"+request.body.description+"', '"+request.body.url+"', '"+request.body.tags+"', '"+request.body.categories+"', "+new Date().getTime()+", 0)");
        client.query("insert into resources (title, description, url, tags, categories, submitted, clicks) values ('"+request.body.title+"', '"+request.body.description+"', '"+request.body.url+"', '"+request.body.tags+"', '"+request.body.categories+"', "+new Date().getTime()+", 0)", function(err, res) {
            response.send({res: 200, msg: err});
        });
    });     
});

// Add a click to a resource
app.post('/api/v1/resources/:id/click', function(request, response) {
    var id = number_validate(request.params.id);
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        client.query("select clicks from resources where id = "+id, function(err, res) {
            var clicks = res.rows[0].clicks + 1;
            console.log("Have "+clicks+" clicks");
            client.query("update resources set clicks = "+clicks+" where id="+id+"", function(err, res) {
                response.send({res:200, clicks: clicks});
            });
        });
    });  
});

// Shortlinks
app.get('/:campaign', function(request, response) {
    campaign = key_validate(request.params.campaign.toLowerCase());
    if(campaign.indexOf('.') > -1 || campaign.indexOf('/') > -1) {
        // Is requesting a file
        response.send(campaign);
        return;
    }      
    // Valid
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        client.query("select * from user_redirects where campaign='"+campaign+"'", function(err, res) {
            if(res.rows.length == 0 || res.rows[0].url == undefined) {
                console.error("Redirection fails");
                response.writeHead(404, {});
                response.end();
                return;
            }
            console.log("Found "+res.rows[0]);
            console.log("Redirecting to "+res.rows[0].url);
            var location = res.rows[0].url;
            if(location.substr(0,4) != "http") {
                location = "http://"+location;   
            }
            response.writeHead(302, {'Location': res.rows[0].url});
            response.end();
        });
    });  
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

//TODO shortlink conflict resolution