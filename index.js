const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Index
app.get('/', (request, response) => {
    response.render('pages/index');
    return;
});

// Add new resource
app.get('/add', (request, response) => {
    response.render('pages/add');
    return;
});

app.get('/loganland', (req, res) => {
    res.redirect('http://terranor-wiki.herokuapp.com');
    return;
});

app.get('/felkerland', (req, res) => {
    res.redirect('http://felker-rpg.herokuapp.com/');
    return;
});

// Campaign shortlink
app.get('/c', (request, response) => {
    response.render('pages/campaign');
    return;
});
app.get('/campaign', (request, response) => {
    response.render('pages/campaign');
    return;
});

// Search results
app.get('/search', (request, response) => {
    response.render('pages/search');
    return;
});

// Custom generators
app.get('/generators/:name', (request, response) => {
    const {name} = request.params;
    let page = 'pages/index';
    switch(name) {
        case "backstory":
        case "character":
            page = 'pages/generator_backstory';
            break;
        case "town":
        case "fantasytown":
            page = 'pages/generator_town';
            break;
        case "inn":
        case "tavern":
        case "pub":
        case "bar":
            page = 'pages/generator_inn';
            break;
    }
    response.render(page);
});

// Custom tables
app.get('/tables/:name', (request, response) => {
    const {name} = request.params;
    let page = 'pages/index';
    switch(name) {
        case "camp":
        case "camping":
        case "nighttime":
        case "overnight":
        case "watch":
            page = 'pages/table_nighttime';
            break;
        case "weather":
        case "climate":
            page = 'pages/table_weather';
            break;
    }
    response.render(page);
});

// Custom tools
app.get('/tools/:name', (request, response) => {
    const {name} = request.params;
    let page = 'pages/index';
    switch(name) {
        case 'time':
        case 'clock':
            page = 'pages/time_tracker';
            break;
    }
    response.render(page);
});

// Custom lists
app.get('/lists/:name', (request, response) => {
    const {name} = request.params;
    let page = 'pages/index';
    switch(name) {
        case 'town':
        case 'city':
        case 'facilities':
        case 'village':
            page = 'pages/list_facilities';
            break;
    }
    response.render(page);
});

const {blogposts, blogtags} = require('./blog');
const fs = require('fs');
const dateformat = require('dateformat');

// Blog
app.get('/blog', (request, response) => {
    response.render('pages/blog_index', {
        blogId: Object.keys(blogposts),
        blogData: Object.values(blogposts),
        dateformat: dateformat
    });
});

app.get('/blog/tag/:tag', (request, response) => {
    const tag = request.params.tag;
    response.render('pages/blog_index', {
        blogId: blogtags[tag],
        blogData: blogtags[tag].map(id => {
            return blogposts[id];
        }),
        dateformat: dateformat
    });
});

// Blog
app.get('/blog/:id', (request, response) => {
    const id = request.params.id;
    if (id === 'rss') {
        // Generate an RSS feed
        let feed = `<?xml version="1.0" encoding="UTF-8"?>
            <feed xmlns="http://www.w3.org/2005/atom" xml:lang="en">
            <title>MyDnD .party Blog</title>
            <icon>http://mydnd.party/simple-dragon.png</icon>`;
        const posts = Object.entries(blogposts);
        for (post of posts) {
            const postId = post[0];
            const postData = post[1];
            feed += `
            <entry>
                <id>http://mydnd.party/blog/${postId}</id>
                <published>${postData.published}</published>
                <updated>${postData.updated}</updated>
                <title>${postData.title}</title>
                <content type="html">${fs.readFileSync(postData.filepath)}</content>
                <author><name>${postData.author}</name></author>
            </entry>
            `;
        }
        feed += `</feed>`;
        response.set('Content-Type', 'text/xml');
        response.send(feed);
    } else {
        // Obtain the blog post info
        const post = blogposts[id];
        response.render('pages/blog_page', {
            postData: post,
            postContent: fs.readFileSync(post.filepath),
            dateformat: dateformat
        });
    }
});

// Other links from around the web
app.get('/links/:name', (request, response) => {
    const {name} = request.params;
    let page = 'pages/index';
    switch(name) {
        case 'metals':
            page = 'https://olddungeonmaster.wordpress.com/2016/12/02/dd-5e-metals/';
            break;
        case 'herbs':
            page = 'http://www.traykon.com/pdf/HerbEncounterList.pdf';
            break;
    }
    if (page != 'pages/index') {
        response.redirect(page);
    }
    response.render(page);
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});