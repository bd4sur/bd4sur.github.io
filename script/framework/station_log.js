function LoadStationLog() {


    // 渲染时间线
    function RenderTimeline(stationLog) {
        let items = new Object();
        for(let i = 0; i < stationLog.length; i++) {
            let times = new Array();
            times.push(stationLog[i].time.split(" ")[0]);
            times = times.concat(stationLog[i].updates);
            for(let j = 0; j < times.length; j++) {
                let time = times[j];
                if(!items[time]) {
                    items[time] = new Array();
                }
                items[time].push(stationLog[i]);
            }
        }

        $("#WeekCountContainer").append(`<td class="WeekCount"></td>`);
        $("#DaysContainer").append(`<td>
            <div class="Weektag">月</div>
            <div class="Weektag">火</div>
            <div class="Weektag">水</div>
            <div class="Weektag">木</div>
            <div class="Weektag">金</div>
            <div class="Weektag">土</div>
            <div class="Weektag">日</div>
        </td>`);

        let date = new Date();
        let currentMonth = date.getMonth() + 1;

        let weekDayCount = 0;
        let weekCount = 0;
        let newYearDayWeek = new Date(date.getFullYear(), 0, 1).getDay(); // 当年元旦是星期几
        newYearDayWeek = (newYearDayWeek === 0) ? 7 : newYearDayWeek;
        const MONTH_DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        let isLeapYear = false;
        let fullyear = date.getFullYear();
        if(fullyear % 100 === 0) {
            if(fullyear % 400 === 0) isLeapYear = true;
            else isLeapYear = false;
        }
        else {
            if(fullyear % 4 === 0) isLeapYear = true;
            else isLeapYear = false;
        }
        let weekRowStr = `<td>`;

        // 处理1月1日之前的空格（TODO 每年第一周的处理逻辑应对标ISO8601）
        newYearDayWeek--;
        while(newYearDayWeek > 0) {
            weekRowStr += `<div class="Day Blank"></div>`;
            weekDayCount++;
            newYearDayWeek--;
        }

        for(let month = 1; month <= currentMonth; month++) { // 注意getMonth()返回的月份数字从0开始
            let monthDays = MONTH_DAYS[month];
            if(month === 2 && isLeapYear === true) monthDays++;
            for(let day = 1; day <= monthDays; day++) {
                let firstDay = (day === 1) ? " Firstday" : "";
                let monthString = ("00" + String(month)).slice(-2);
                let dayString = ("00" + String(day)).slice(-2);
                let dateString = `${date.getFullYear()}-${monthString}-${dayString}`;

                let level = "";
                if(items[dateString]) {
                    let articleNumber = items[dateString].length;
                    if(articleNumber === 1) { level = " L1"; }
                    else if(articleNumber === 2) { level = " L2"; }
                    else if(articleNumber === 3) { level = " L3"; }
                    else if(articleNumber  >= 4) { level = " L4"; }
                }
                else {
                    level = "";
                }
                weekRowStr += `<div class="Day${firstDay}${level}" id="Article-${dateString}" data-time="${dateString}" title="${dateString}"></div>`;
                weekDayCount++;
                if(weekDayCount % 7 === 0) {
                    weekCount++;
                    weekRowStr += `</td>`;
                    $("#DaysContainer").append(weekRowStr);
                    $("#WeekCountContainer").append(`<td class="WeekCount">${weekCount}</td>`);
                    weekRowStr = `<td>`;
                }
                else if(day === monthDays && month === currentMonth) {
                    weekCount++;
                    let blanks = 7 - weekDayCount % 7;
                    if(blanks < 7) {
                        for(let i = 0; i < blanks; i++) {
                            weekRowStr += `<div class="Day Blank"></div>`;
                        }
                    }
                    weekRowStr += `</td>`;
                    $("#DaysContainer").append(weekRowStr);
                    $("#WeekCountContainer").append(`<td class="WeekCount">${weekCount}</td>`);
                    weekRowStr = `<td>`;
                }
            }
        }

        // 转到某个文章的位置
        function TurnToItem(date) {
            let targetTop = window.pageYOffset + $(`tr[data-date='${date}']`)[0].getBoundingClientRect().top;
            $('html, body').animate({ scrollTop: targetTop-40 }, 200, 'easeOutExpo'); // 照顾顶部sticky导航栏的40px高度
        }

        $(".Day").each((i, e) => {
            $(e).on("click", () => {
                let time = $(e).attr("data-time");
                if(time in items) {
                    TurnToItem(time);
                }
            });
        });
    }







    let xhr = new XMLHttpRequest();
    xhr.open("GET", `./markdown/station_log.md`);
    xhr.onreadystatechange = () => {
        if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
            let log = JSON.parse(xhr.responseText);
            // for(let i = 0; i < log.length; i++) {
            for(let i = log.length - 1; i >= 0 ; i--) {
                let item = log[i];
                let date = item.time.split(" ")[0];
                let time = item.time.split(" ")[1];
                $("#StationLogTable").append(`
<tr data-date="${date}" onclick="$('#StationLog_${i}').toggle();" class="StationLogItem">
    <td>${date} ${time}</td>
    <td><strong>${item.callsign}</strong></td>
    <td>${item.freq}</td>
    <td>${item.mode}</td>
    <td>${item.rst}</td>
</tr>
<tr id="StationLog_${i}" style="display: none;" class="StationLogItemDetails">
    <td colspan="5">
        <strong>对方 </strong>${item.rig} / ${item.ant} / ${item.pwr} / ${item.qth}<br>
        <strong>本台 </strong>${item.rig_self} / ${item.ant_self} / ${item.pwr_self} / ${item.qth_self}<br>
        <strong>备注 </strong>${item.note}
    </td>
</tr>
`);
            }

            RenderTimeline(log);
        }
        else if(xhr.readyState === XMLHttpRequest.DONE && xhr.status !== 200){
            $("#StationLogTable").html("没有找到日志数据...");
            return;
        }
    };
    xhr.send();
}

