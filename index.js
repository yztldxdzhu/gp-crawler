let superagent = require('superagent');
// let http = require('http');
let cheerio = require('cheerio');
let async = require('async');
let request = require('request');

console.log('start...');

// let pages = ['school015/', 'school015_2/', 'school015_3/', 'school015_4/', 'school015_5/', 'school015_6/', 'school015_7/'];
let pages = ['school015/'];
let schoolLinkList = [];
let schoolsInfos = [];

async.mapLimit(pages, 7, function (page, cb) {
    // console.log(page);
    fetchPage(page, cb);
}, function (err, res) {
    // console.log(err, res);
    // console.log(schoolLinkList, schoolLinkList.length);//130所大学
    // console.log('done!');

    async.mapLimit(schoolLinkList, 7, function (schoolLink, cb) {
        // console.log(schoolLink);
        fetchSchool(schoolLink, cb);
    }, function (err, res) {
        // console.log(err, res);
        console.log(schoolsInfos, schoolsInfos.length);
        console.log('done!');


        console.log('开始发送');




        let options = {
            headers: {"Connection": "close"},
            url: 'http://localhost:8080/gp/university/addUniversity',
            method: 'POST',
            json: true,
            body: schoolsInfos
        };

        function callback(error, response, data) {
            console.log(data);
            if (!error && response.statusCode == 200) {
                console.log('----info------',data);
            }
        }
        request(options, callback);

        /*let bodyString = JSON.stringify(dataObj);
        console.log(bodyString);

        let headers = {
            'Content-Type': 'application/json',
            'Content-Length': bodyString.length
        };


        let options = {
            host: 'localhost',
            port: 8080,
            path: '/gp/university/addUniversity',
            method: 'POST',
            headers: headers
        };

        let req = http.request(options, function(res){

            res.setEncoding('utf-8');

            let responseString = '';

            res.on('data', function(data) {
                responseString += data;
            });

            res.on('end', function() {
                let resultObject = JSON.parse(responseString);
                console.log('-----resBody-----',resultObject);
            });

            req.on('error', function(e) {
                console.log('-----error-------',e);
            });
        });

        req.write(bodyString);

        req.end();*/

        console.log("end...")
    });


});
function fetchPage(page, cb) {
    superagent
        .get('http://au.51liucheng.com/' + page)
        .end(function (err, res) {
            let $ = cheerio.load(res.text, {decodeEntities: false});
            $("div.toplist > a").each(function(i, ele) {
                let schoolLink = $(ele).attr("href");
                schoolLinkList.push(schoolLink);
            });
            cb(null, page);
        })
}
function fetchSchool(url, cb) {
    superagent
        .get(url)
        .end(function (err, res) {
            let $ = cheerio.load(res.text, {decodeEntities: false});
            let universityLogo = $("div.tupyx > img").attr('src');//学校图片logo
            let universityName = $("div.inmclawarps > h1").text();//学校中文名称
            let universityEnname = $("div.inmclawarps > p").text();//学校英文名称
            let universityUrl = $("ul.colspUl a").attr('href');//学校官网
            let universityProperty;//学院性质
            let universityState;//学院区域

            let text;
            let lis = $("ul.colspUl>li");
            $(lis).each(function (i, li) {
                text = $(li).text();
                if(text.indexOf("学院性质") > -1){
                    universityProperty = text.split('：')[1].toString();
                }else if(text.indexOf("区　　域") > -1){
                    universityState = text.split('：')[1].toString();
                }
            });

            console.log(universityName);

            let divs = $("div.tabUl > div.abcon");
            let universityDescription = $($(divs)[0]).html();//学校详情

            let collegeList = [];

            let collegeListDom = $($(divs)[1]).find($("div.specialty")).html();//专业情况


            let majorDirections = $("div.specialty>ul>li");



            for(let i = 0, len = $(majorDirections).length; i < len; i++){
                let college = {};
                let majorList = [];

                college.collegeName = $($(majorDirections)[i]).text();
                let majDom = $(".tuijyxm.zyfxlist")[i];
                $(majDom).find($(".lizixun")).each(function (i, maj) {
                    let major = {};
                    major.majorName = $(maj).find("p").text();
                    majorList.push(major);
                });

                college.majorList = majorList;
                collegeList.push(college);
                // console.log(college);

            }

            if( !collegeListDom ){//是否有这个DOM元素，没有则说明专业数据为空
                collegeList = [];
            }

            let schoolInfos = {};
            schoolInfos.universityLogo = universityLogo;
            schoolInfos.universityName = universityName;
            schoolInfos.universityEnname = universityEnname;
            schoolInfos.universityUrl = universityUrl;
            schoolInfos.universityProperty = universityProperty;
            schoolInfos.universityState = universityState;
            schoolInfos.universityDescription = universityDescription;
            schoolInfos.collegeList = collegeList;

            schoolsInfos.push(schoolInfos);

            cb(null, url);
        });
}