const MZ = "MZ";
const PE = "PE";
const PeOffset = 64;
const Machine = 332;
const Rsrc = "rsrc";
const TypeT = 16;
const DefaultVersion = "0.0.0.0";

// 获取exe dll版本
function getExeVersion(fileContent) {
    // 第一次从文件开头截取 64 byte
    let startPosition = 0;
    let endPosition = 64;

    let buffer = new Int8Array(fileContent.slice(startPosition, endPosition));

    let str = String.fromCharCode(buffer[0]) + String.fromCharCode(buffer[1]);
    if (str != MZ) {
        console.log("读取exe错误,找不到 MZ.");
        return DefaultVersion;
    }

    let peOffset = unpack([buffer[60], buffer[61], buffer[62], buffer[63]]);
    if (peOffset < PeOffset) {
        console.log("peOffset 读取错误.");
        return DefaultVersion;
    }


    // 第二次从文件开头移位到 peOffset，截取 24 byte
    startPosition = peOffset;
    endPosition = peOffset + 24;

    buffer = new Int8Array(fileContent.slice(startPosition, endPosition));
    str = String.fromCharCode(buffer[0]) + String.fromCharCode(buffer[1]);
    if (str != PE) {
        console.log("读取exe错误,找不到 PE.");
        return DefaultVersion;
    }

    let machine = unpack([buffer[4], buffer[5]]);
    if (machine != Machine) {
        console.log("machine 读取错误.");
        return DefaultVersion;
    }

    let noSections = unpack([buffer[6], buffer[7]]);
    let optHdrSize = unpack([buffer[20], buffer[21]]);

    // 第三次读取从上次读取的位置偏移位到 optHdrSize，截取 noSections * 40 byte
    startPosition = endPosition + optHdrSize;
    endPosition = startPosition + (noSections * 40);

    buffer = new Int8Array(fileContent.slice(startPosition, endPosition));
    let resFound = false;
    for (let i = 0; i < noSections; i++) {
        let buffer2 = buffer.slice(i * 40, (i + 1) * 40);
        let str = String.fromCharCode(buffer2[1]) + String.fromCharCode(buffer2[2]) + String.fromCharCode(buffer2[3]) + String.fromCharCode(buffer2[4]);
        if (str == Rsrc) {
            buffer = buffer2;
            resFound = true;
            break;
        }
    }
    if (!resFound) {
        console.log("读取exe错误,找不到 .rsrc.");
        return DefaultVersion;
    }

    let infoVirt = unpack([buffer[12], buffer[13], buffer[14], buffer[15]]);
    let infoSize = unpack([buffer[16], buffer[17], buffer[18], buffer[19]]);
    let infoOff = unpack([buffer[20], buffer[21], buffer[22], buffer[23]]);

    // 第四次从文件开头位置移位到 infoOff，第四次读取 infoSize byte
    startPosition = infoOff;
    endPosition = infoOff + infoSize;
    buffer = new Int8Array(fileContent.slice(startPosition, endPosition));

    let nameEntries = unpack([buffer[12], buffer[13]]);
    let idEntries = unpack([buffer[14], buffer[15]]);

    let infoFound = false;
    let subOff = 0;
    for (let i = 0; i < (nameEntries + idEntries); i++) {
        let typeT = unpack([buffer[i * 8 + 16], buffer[i * 8 + 17], buffer[i * 8 + 18], buffer[i * 8 + 19]]);
        if (typeT == TypeT) {
            infoFound = true;
            subOff = unpack([buffer[i * 8 + 20], buffer[i * 8 + 21], buffer[i * 8 + 22], buffer[i * 8 + 23]]);
            break;
        }
    }
    if (!infoFound) {
        console.log("读取exe错误,找不到 typeT == " + typeT);
        return DefaultVersion;
    }

    subOff = subOff & 0x7fffffff;
    infoOff = unpack([buffer[subOff + 20], buffer[subOff + 21], buffer[subOff + 22], buffer[subOff + 23]]);
    infoOff = infoOff & 0x7fffffff;
    infoOff = unpack([buffer[infoOff + 20], buffer[infoOff + 21], buffer[infoOff + 22], buffer[infoOff + 23]]);
    let dataOff = unpack([buffer[infoOff], buffer[infoOff + 1], buffer[infoOff + 2], buffer[infoOff + 3]]);
    dataOff = dataOff - infoVirt;

    let version1 = unpack([buffer[dataOff + 48], buffer[dataOff + 48 + 1]]);
    let version2 = unpack([buffer[dataOff + 48 + 2], buffer[dataOff + 48 + 3]]);
    let version3 = unpack([buffer[dataOff + 48 + 4], buffer[dataOff + 48 + 5]]);
    let version4 = unpack([buffer[dataOff + 48 + 6], buffer[dataOff + 48 + 7]]);

    let version = `${version2}.${version1}.${version4}.${version3}`;

    return version;
}

function unpack(buffer) {
    let num = 0;
    for (let i = 0; i < buffer.length; i++) {
        num = 256 * num + (buffer[buffer.length - 1 - i] & 0xff)
    }
    return num
}