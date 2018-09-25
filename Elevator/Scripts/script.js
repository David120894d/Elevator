
$(document).ready(function () {
    GetMap();
});

// Функция загрузки
function GetMap() {
    google.maps.visualRefresh = true;
    // установка основных координат
    var Moscow = new google.maps.LatLng(55.752622, 37.617567);

    // Установка общих параметров отображения карты, как масштаб, центральная точка и тип карты
    var mapOptions = {
        zoom: 10,
        center: Moscow,
        mapTypeId: google.maps.MapTypeId.G_NORMAL_MAP
    };

    // Встраиваем гугл-карты в элемент на странице и получаем объект карты
    var map = new google.maps.Map(document.getElementById("canvas"), mapOptions);

    // Настраиваем красный маркер, который будет использоваться для центральной точки
    //var myLatlng = new google.maps.LatLng(55.752622, 37.617567);

    //var marker = new google.maps.Marker({
    //    position: myLatlng,
    //    map: map,
    //    title: 'Станции метро'
    //});

    // Берем для маркера иконку с сайта google
    //marker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png')

    // Получаем данные
    $.getJSON('GetData', function (data) {
        console.log(data);
        // Проходим по всем данным и устанавливаем для них маркеры
        $.each(data, function (i, item) {
            var marker = new google.maps.Marker({
                position: new google.maps.LatLng(item.GeoLat, item.GeoLong),
                map: map,
                title: item.PlaceName
            });

            // Берем для этих маркеров синие иконки с сайта google
            marker.setIcon('http://maps.google.com/mapfiles/ms/icons/blue-dot.png')

            // Для каждого объекта добавляем доп. информацию, выводимую в отдельном окне
            var infowindow = new google.maps.InfoWindow({
                content: "<div class='stationInfo'><h2>" + item.PlaceName + "</h2>" +
                    //< div > <h4>Линия метро: "
                    //+ item.Line + "</h4></div><div><h4>Пассажиропоток: " + item.Traffic + " млн. человек</h4></div>
                "</div >"
            });

            // обработчик нажатия на маркер объекта
            google.maps.event.addListener(marker, 'click', function () {
                infowindow.open(map, marker);
            });
        })
    });
}