const express = require("express");
const fs = require("fs");
const schedule = require("node-schedule");
const path = require("path");
const Log = require('log')
    , log = new Log('info', fs.createWriteStream('log.log'));
const app = express();
var mysql = require('mysql');
var pool = mysql.createPool({
    host: '192.168.120.221',
    user: 'root',
    password: 'password',
    database: 'registro_ftp'
});
var usuarios = [];

function getLinea(linea) {
    var archivo = getFecha();
    return {
        dia: linea[0],
        mes: linea[1],
        diaFecha: linea[2],
        hora: linea[3],
        año: linea[4],
        velocidad_desc: linea[5],
        ip: linea[6],
        tamaño_archivo: linea[7],
        ruta_archivo: linea[8],
        B: linea[9],
        Guion: linea[10],
        O: linea[11],
        R: linea[12],
        usuario: linea[13],
        protocolo: linea[14],
        Cero: linea[15],
        Asterisco: linea[16],
        estado: linea[17],
        archivo_log: archivo
    }
}

function getFecha() {
    var d = new Date();
    var dia = d.getDate();
    var mes = d.getMonth() + 1;
    var año = d.getFullYear();
    var fecha = año + "" + mes + "" + dia;
    var archivo = "xferlog-" + fecha;
    return archivo;
}

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get("/select", function (req, res) {
    pool.query('SELECT * from registroftp', function (err, rows, fields) {
        rows.forEach(function (item, index) {
            console.log(item.usuario);
        });
    });
    res.send("ok");
})

log.info("1");

app.get("/actual", function (req, res) {
    var reporte;
    var rpta = {};
    fs.readFile(__dirname + "/../../var/log/xferlog", "utf8", function (err, data) {
        if (err) {
            console.log("no se pudo");
            rpta = {
                "cod": 0,
                "msg": "error"
            };
            log.info("casi");
            res.send(rpta);
        } else {
            console.log("si se pudo");
            var tr = data.split("\n");
            tr.forEach(function (item, index) {
                var palabra = item.split(" ");
                if (palabra.length === 19) {
                    var i = palabra.indexOf("");
                    palabra.splice(i, 1);
                }
                reporte = getLinea(palabra);
                pool.query('INSERT INTO reporteftp SET ?', reporte, function (err) {
                    if (err) {
                        console.log(err);
                        if (err.code == "ER_DUP_ENTRY") {
                            console.log("error, ya existen");
                            log.info("ya existe");
                        }
                    }else{
                        log.info("bien");
                    }
                });
            })
            rpta = {
                "cod": 1,
                "msg": "ok"
            };
            res.send(rpta);
        }
    });
})

var reporte;
var archivo = getFecha();
var rule = new schedule.RecurrenceRule();
rule.hour = 06;
rule.minute = 00;
var j = schedule.scheduleJob(rule, function () {
    fs.readFile(__dirname + "/../../var/log/" + archivo, "utf8", function (err, data) {
        if (err) {
            console.log("no se pudo");
        } else {
            console.log("si se pudo subir");
            var tr = data.split("\n");
            tr.forEach(function (item, index) {
                var palabra = item.split(" ");
                reporte = getLinea(palabra);
                pool.query('INSERT INTO reporteftp SET ?', reporte, function (err) {
                    if (err) {
                        console.log(err);
                        if (err.code == "ER_DUP_ENTRY") {
                            console.log("error, ya existen");
                        }
                    }else{
                    }
                });
            })
        }
    });
});

app.listen(3000, function () {
    console.log("Listo puerto");
});