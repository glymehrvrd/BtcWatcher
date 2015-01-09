$(document).bind("mobileinit", function() {
    $.support.cors = true;
    $.mobile.allowCrossDomainPages = true;
});

// hack backkey
document.addEventListener("deviceready", function() {
    document.addEventListener("backbutton", function(e) {
        navigator.notification.confirm(
            ("Do you want to Exit?"), // message
            function(button) {
                if (button == 1) {
                    e.preventDefault();
                    navigator.app.exitApp();
                }
            }, // callback
            'CONFIRMATION', // title
            'YES,NO' // buttonName
        );
    }, false);
}, true);


//坏数字
function badFloat(num, size) {
    if (isNaN(num)) return true;
    num += '';
    if (-1 == num.indexOf('.')) return false;
    var f_arr = num.split('.');
    if (f_arr[1].length > size) {
        return true;
    }
    return false;
}

//格式化小数
//@f float 传入小数: 123; 1.1234; 1.000001;
//@size int 保留位数
//@add bool 进位: 0舍 1进
function formatfloat(f, size, add) {
    f = parseFloat(f);
    var conf = size == 2 ? [100, 0.01] : [1000, 0.001];
    var ff = Math.floor(f * conf[0]) / conf[0];
    if (add && f > ff) ff += conf[1];
    return ff;
}

//最大可买
function buy_max(price) {
    price = formatfloat(price, 2);
    if (user.rmb_over > 0 && price > 0) {
        $('#buy_max').text(formatfloat(user.rmb_over / price, 3));
    }
}

//总价
function sumprice(type) {
    var inputtype = type == 'buy' ? 'in' : 'out';
    $('#' + type + '_sumprice').html(formatfloat(formatfloat($('#price' + inputtype).val(), 2) * formatfloat($('#number' + inputtype).val(), 3), 5));
}

//验证价格
function vNum(o, len) {
    if (badFloat(o.value, len)) o.value = formatfloat(o.value, len, 0);
}

//委托提交处理
function tbtcSubmit(type) {
    $('#trustbtn' + type).attr('onclick', '');
    $.post("http://www.btctrade.com/ajax/trustbtc/", {
            type: type,
            coin: 'ltc',
            price: parseFloat($('#price' + type).val()),
            number: parseFloat($('#number' + type).val()),
            pwdtrade: 'Ch8cS6Nk2cF6',
            hotp: $('#hotp' + type).val()
        },
        function(d) {
            $('#trustbtn' + type).attr('onclick', 'tbtcSubmit("' + type + '")');
            if (d.status) {
                for (var i in d.data) user[i] = d.data[i];
                refresh_all();
            }
            $('#trustmsg' + type).html(d.msg).fadeOut(500).fadeIn(500).fadeOut(500).fadeIn(500).fadeOut(500).fadeIn(500);
        }, 'json');
}

//取消委托
function trustcancel(id) {
    $.get('http://www.btctrade.com/ajax/trustcancel/id/' + id, function(d) {
        alert(d.msg);
        if (d.status) {
            refresh_all();
        }
    }, 'json');
}

function refresh_all() {
    $.get('http://www.btctrade.com/ltc', function(data) {
        // define variable <user>
        var p = /user = .+/i;
        eval(p.exec(data)[0]);
        refresh_my_orders(data);
        refresh_ua();
        refresh_price();
    });
}

function refresh_price() {
    $.get('http://www.btctrade.com/ltc_sum.js', function(data) {
        $('#buy_price').html(data['buy'][0].p);
        $('#sale_price').html(data['sale'][0].p);
    }, 'json');
}

function refresh_my_orders(data) {
    // get my orders
    var p = /^\s+<span>我的委托挂单<\/span>(.|\n)+?<table class="Transaction">(.|\n)+?<tbody>((.|\n)+?)<\/tbody>/im;
    my_orders = p.exec(data);
    if (my_orders && my_orders.length > 3) {
        $(".Transaction tbody").html(my_orders[3]);
    } else {
        $(".Transaction tbody").html("");
    }
}

// 刷新账户信息
function refresh_ua() {
    ua_rmb_over = $('#ua_rmb_over');
    ua_btc_over = $('#ua_btc_over');
    ua_ltc_over = $('#ua_ltc_over');
    ua_rmb_lock = $('#ua_rmb_lock');
    ua_btc_lock = $('#ua_btc_lock');
    ua_ltc_lock = $('#ua_ltc_lock');
    ua_rmb = $('#ua_rmb')

    ua_rmb_over.text(user.rmb_over);
    ua_rmb_lock.text(user.rmb_lock);
    ua_btc_over.text(user.btc_over);
    ua_btc_lock.text(user.btc_lock);
    ua_ltc_over.text(user.ltc_over);
    ua_ltc_lock.text(user.ltc_lock);

    $('#sale_max').text(user.ltc_over);
    // rmb over
    $.get('http://www.btctrade.com/rmb_rate.js', function(d) {
        var btc_rmb = parseFloat(d.btc);
        var ltc_rmb = parseFloat(d.ltc);

        var btc2R = (parseFloat(user.btc_lock) + parseFloat(user.btc_over)) * btc_rmb;
        var ltc2R = (parseFloat(user.ltc_lock) + parseFloat(user.ltc_over)) * ltc_rmb;
        ua_rmb.text(formatfloat(parseFloat(user.rmb_lock) + parseFloat(user.rmb_over) + btc2R + ltc2R, 2));
    }, 'json');
}

// tp: 1-> change buy price
// 2-> change sale price
function fast_price(tp, add_price) {
    if (tp == 1) {
        var curprice = $.isNumeric($('#pricein').val()) ? Number($('#pricein').val()) : Number($('#sale_price').text());
        $('#pricein').val(curprice + add_price);
        vNum($('#pricein')[0], 2);
        buy_max($('#pricein').val());
        sumprice('buy');
    } else if (tp == 2) {
        var curprice = $.isNumeric($('#priceout').val()) ? Number($('#priceout').val()) : Number($('#buy_price').text());
        $('#priceout').val(curprice + add_price);
        vNum($('#priceout')[0], 2);
        sumprice('sale');
    }
}
// create toolbar for every page
$(function() {
    $("[data-role='header'], [data-role='footer']").toolbar();
});
// Update the contents of the toolbars
$(document).on("pageshow", "[data-role='page']", function() {
    // Remove active class from nav buttons
    $("[data-role='navbar'] a.ui-btn-active").removeClass("ui-btn-active");
    // Add active class to current nav button
    if (location.hash == "") {
        $("[data-role='navbar'] a[href='#market']").addClass('ui-btn-active');
    } else {
        $.each($("[data-role='navbar'] a"), function(index, val) {
            if ($(this).attr('href') == location.hash) {
                $(this).addClass('ui-btn-active');
            }
        });
    }
});

// 初始化登录状态
$(function() {
    if (typeof user == "undefined" || !user.uid) {
        $('#login_state').text('未登录');
        return;
    } else {
        $('#login_state').text('已登录');
        $('#login_state').css('color', 'blue');
        refresh_all();
    }
});

// handle login
$("#rePWButton").click(function(event) {
    $.post('http://www.btctrade.com/user/login/?go=ltc', {
        // fill user information here.
        email: '',
        pwd: '',
        hotp: '',
        captcha: $("input[name='captcha']").val()
    }, function(d, textStatus, xhr) {
        $("#rePWButton").html('登录中<img src="images/ajax-loader.gif">');
        $.get('http://www.btctrade.com/ltc', function(data) {
            var p = /user = .+/i;
            eval(p.exec(data)[0]);
            if (typeof user == "undefined" || !user.uid) {
                $('#login_state').text('登录失败');
            } else {
                $('#login_state').text('已登录');
                $('#login_state').css('color', 'blue');
                refresh_ua();
                refresh_my_orders(data);
                refresh_price();
            }
            $("#rePWButton").html('登录');
        });
    });
});

// handle refresh_all
$("#refreshButton").click(function(event) {
    $("#refreshButton").html('刷新中<img src="images/ajax-loader.gif">');
    refresh_all();
    $("#refreshButton").html('刷新');
});

// handle refresh price
$(function() {
    $('.click_watcher').click(function(event) {
        var siteid = $(this).attr('id') || $(this).attr('site');
        switch (siteid) {
            case 'okcoin_btc':
                $('#' + siteid).html('<td>Btc</td><td colspan="3"><img src="images/ajax-loader.gif"></td>');
                $.get('https://www.okcoin.com/api/ticker.do', function(data) {
                    $('#okcoin_btc').html('<td>Btc</td>' + '<td>&#65509;' + formatfloat(data.ticker.high) + '</td>' + '<td>&#65509;' + formatfloat(data.ticker.low) + '</td>' + '<td>&#65509;' + formatfloat(data.ticker.last) + '</td>');
                }, 'json');
                break;
            case 'okcoin_ltc':
                $('#' + siteid).html('<td>Ltc</td><td colspan="3"><img src="images/ajax-loader.gif"></td>');
                $.get('https://www.okcoin.com/api/ticker.do?symbol=ltc_cny', function(data) {
                    $('#okcoin_ltc').html('<td>Ltc</td>' + '<td>&#65509;' + formatfloat(data.ticker.high) + '</td>' + '<td>&#65509;' + formatfloat(data.ticker.low) + '</td>' + '<td>&#65509;' + formatfloat(data.ticker.last) + '</td>');
                }, 'json');
                break;
            case 'btce_btc':
                $('#' + siteid).html('<td>Btc</td><td colspan="3"><img src="images/ajax-loader.gif"></td>');
                $.get('https://btc-e.com/api/2/btc_usd/ticker', function(data) {
                    $('#btcchina_btc').html('<td>Btc</td>' + '<td>$' + formatfloat(data.ticker.high) + '</td>' + '<td>$' + formatfloat(data.ticker.low) + '</td>' + '<td>$' + formatfloat(data.ticker.last) + '</td>');
                }, 'json');
                break;
            case 'btce_ltc':
                $('#' + siteid).html('<td>Btc</td><td colspan="3"><img src="images/ajax-loader.gif"></td>');
                $.get('https://btc-e.com/api/2/ltc_usd/ticker', function(data) {
                    $('#btcchina_btc').html('<td>Btc</td>' + '<td>$' + formatfloat(data.ticker.high) + '</td>' + '<td>$' + formatfloat(data.ticker.low) + '</td>' + '<td>$' + formatfloat(data.ticker.last) + '</td>');
                }, 'json');
                break;
            case 'btctrade_ltc':
                $('#' + siteid).html('<td>Ltc</td><td colspan="3"><img src="images/ajax-loader.gif"></td>');
                $.get('http://www.btctrade.com/rmb_rate.js', function(data) {
                    $.get('http://www.btctrade.com/ltc_order.js', function(data2) {
                        $('#btctrade_ltc').html('<td>Btc</td>' + '<td>&#65509;' + formatfloat(data2.max) + '</td>' + '<td>&#65509;' + formatfloat(data2.min) + '</td>' + '<td>&#65509;' + formatfloat(data.ltc) + '</td>');
                    }, 'json');
                }, 'json');
                break;
        }
    });
});