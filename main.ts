function doTare () {
    logEvent("#Doing tare")
    basic.pause(pumpSettleTime)
    tareActive = 1
    HX711.power_up()
    HX711.tare(numTare)
    HX711.power_down()
    tareActive = 0
}
// TODO - add test readingsMax to see if over limit
function showWeight () {
    HX711.power_up()
    rawWeight = HX711.get_units(20)
    rawWeightx10 = rawWeight * 10
    weight = Math.round(rawWeightx10) / 10
    serial.writeLine("" + dateTimeString() + weight + "g")
    dateTimeReadings.push(dateTimeString())
    weightReadings.push("" + weight + "g")
    HX711.power_down()
}
function parseCommand () {
    command = stringIn.substr(0, 2)
    params = stringIn.substr(2, stringIn.length - 2)
    if (command.compare("rt") == 0) {
        serial.writeLine("" + command + ": " + params)
        serial.writeLine("" + (dateTimeString()))
    } else if (command.compare("st") == 0) {
        setTime()
    } else if (command.compare("xx") == 0) {
        serial.writeLine("Deleting stored data!")
        deleteReadings()
    } else if (command.compare("mt") == 0) {
        serial.writeLine("Emptying tank!")
        emptyTank()
    } else if (command.compare("ta") == 0) {
        serial.writeLine("Doing tare!")
        doTare()
    } else {
        serial.writeLine("Invalid command")
    }
}
function pumpControl (pumpState: number) {
    pins.digitalWritePin(DigitalPin.P8, pumpState)
}
function deleteReadings () {
    readingsLength = dateTimeReadings.length
    for (let index = 0; index < readingsLength; index++) {
        dateTimeReadings.pop()
        weightReadings.pop()
    }
}
function leadingZero (num: number) {
    if (num < 10) {
        return "0" + num
    } else {
        return convertToText(num)
    }
}
// Upload readings to BT
bluetooth.onBluetoothConnected(function () {
    connected = 1
    basic.showIcon(IconNames.Square)
    upload()
})
bluetooth.onBluetoothDisconnected(function () {
    connected = 0
    basic.clearScreen()
})
input.onButtonPressed(Button.A, function () {
    emptyTank()
})
// Read and report weight every ~1 minute TODO add persistence check!!!!
function readWeight () {
    // Display continuously unless tare is operating
    if (tareActive == 0) {
        showWeight()
        // Check if presistence
        if (weight > weightLimit) {
            // Ignore "large" transient change
            lastWeight = weight
            showWeight()
            if (lastWeight > weight * 0.9) {
                emptyTank()
            }
        }
    }
}
// Store an event (text) and also send it to serial (USB)
function logEvent (text: string) {
    serial.writeLine(text)
    dateTimeReadings.push(dateTimeString())
    weightReadings.push(text)
}
function dateTimeString () {
    return "" + leadingZero(DS3231.date()) + "/" + leadingZero(DS3231.month()) + "/" + DS3231.year() + " " + leadingZero(DS3231.hour()) + ":" + leadingZero(DS3231.minute()) + " "
}
function upload () {
    readingsLength = dateTimeReadings.length
    if (readingsLength != 0) {
        for (let index2 = 0; index2 <= readingsLength - 1; index2++) {
            if (connected == 1) {
                bluetooth.uartWriteString(dateTimeReadings[index2])
                basic.pause(10)
                bluetooth.uartWriteLine(weightReadings[index2])
                basic.pause(10)
            }
        }
        basic.showIcon(IconNames.Yes)
    } else {
        bluetooth.uartWriteLine("No stored readings!")
    }
}
// set the time - from serial USB ONLY
function setTime () {
    serial.writeLine("" + command + ": " + params)
    yr = params.substr(0, 4)
    mo = params.substr(4, 2)
    dt = params.substr(6, 2)
    hh = params.substr(8, 2)
    mm = params.substr(10, 2)
    DS3231.dateTime(
    parseFloat(yr),
    parseFloat(mo),
    parseFloat(dt),
    4,
    parseFloat(hh),
    parseFloat(mm),
    0
    )
    serial.writeLine("#Date & time have been set")
}
function emptyTank () {
    logEvent("#Empty tank")
    pumpControl(1)
    basic.pause(pumpOnTime)
    pumpControl(0)
    basic.pause(10000)
    doTare()
}
let charIn = ""
let mm = ""
let hh = ""
let dt = ""
let mo = ""
let yr = ""
let lastWeight = 0
let connected = 0
let readingsLength = 0
let params = ""
let command = ""
let weight = 0
let rawWeightx10 = 0
let rawWeight = 0
let stringIn = ""
let tareActive = 0
let numTare = 0
let weightLimit = 0
let weightReadings: string[] = []
let dateTimeReadings: string[] = []
let pumpSettleTime = 0
let pumpOnTime = 0
let pumpState = 0
pumpOnTime = 20000
pumpSettleTime = 30000
let readingPeriod = 60000
let readingsMax = 3000
// storage
dateTimeReadings = []
weightReadings = []
weightLimit = 300
numTare = 50
tareActive = 0
basic.clearScreen()
bluetooth.startUartService()
pumpControl(0)
HX711.SetPIN_DOUT(DigitalPin.P1)
HX711.SetPIN_SCK(DigitalPin.P2)
HX711.begin()
HX711.set_offset(8481274)
HX711.set_scale(415)
serial.writeLine("#*** Button A=pump ON for 20s ***")
logEvent("#Start up")
emptyTank()
stringIn = ""
// Process serial input 
basic.forever(function () {
    charIn = serial.readString()
    stringIn = "" + stringIn + charIn
    if (charIn.compare(String.fromCharCode(13)) == 0) {
        serial.writeString("" + String.fromCharCode(13) + String.fromCharCode(10))
        parseCommand()
        stringIn = ""
    } else {
        serial.writeString(charIn)
    }
})
// Read the weight
loops.everyInterval(readingPeriod, function () {
    readWeight()
    // Brief heartbeat
    basic.showIcon(IconNames.Heart)
    basic.pause(100)
    basic.clearScreen()
})
