import crypto from "crypto";

const algorithm = "aes-256-cbc";

function encrypt(text) {

    let iv = crypto.randomBytes(16);
    let salt = crypto.randomBytes(16);
    let key = crypto.scryptSync("hwwlllll", salt, 32);

    let cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    return `${iv.toString("hex")}:${salt.toString("hex")}:${encrypted}`;

}

function decrypt(text) {

    let [ivs, salts, data] = text.split(":");
    let iv = Buffer.from(ivs, "hex");
    let salt = Buffer.from(salts, "hex");
    let key = crypto.scryptSync("hwwlllll", salt, 32);

    let decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(data, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted.toString();

}

export default {
    encrypt,
    decrypt
};