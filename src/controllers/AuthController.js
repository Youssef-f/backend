const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");
const { secretKey } = require("../config");

exports.registerUser = async (req, res) => {
  try {
    const { firstname, lastname, email, password, address, phone_number } =
      req.body;
    const is_admin = Boolean(req.body.is_admin);

    // Check for empty fields
    if (
      !firstname ||
      !lastname ||
      !email ||
      !password ||
      !address ||
      !phone_number
    ) {
      return res.status(400).json({ error: "All fields must be filled out." });
    }

    // Custom validation for firstname
    if (!/^[a-zA-Z]+$/.test(firstname)) {
      return res.status(400).json({
        error: "First name must only contain alphabetical characters.",
      });
    }

    // Custom validation for lastname
    if (!/^[a-zA-Z]+$/.test(lastname)) {
      return res.status(400).json({
        error: "Last name must only contain alphabetical characters.",
      });
    }

    // Custom validation for email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email address." });
    }

    // Validate password length
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long." });
    }

    // Check for unique email and phoneNumber
    const isEmailUnique = await User.findOne({ email });
    const isPhoneNumberUnique = await User.findOne({ phone_number });

    if (isEmailUnique) {
      return res.status(400).json({ error: "Email is already in use." });
    }

    if (isPhoneNumberUnique) {
      return res.status(400).json({ error: "Phone number is already in use." });
    }

    // Hash the password before storing it in the database
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstname,
      lastname,
      email,
      password: hashedPassword,
      address,
      phone_number,
      is_admin: is_admin || false,
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });

    // Check if the user exists and verify the password
    if (user && (await bcrypt.compare(password, user.password))) {
      // Create a JWT token
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        secretKey,
        { expiresIn: "1h" }
      );
      res.status(200).json({ token, user });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
