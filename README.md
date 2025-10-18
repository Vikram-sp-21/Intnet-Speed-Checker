# Internet Speed Checker

This project is a simple web application that allows users to check their internet speed. It measures both download and upload speeds and provides a user-friendly interface to display the results.

## Project Structure

```
internet-speed-checker
├── public
│   ├── index.html         # Main HTML document for the webpage
│   ├── css
│   │   └── styles.css     # Styles for the webpage
│   └── js
│       ├── speedtest.js   # Logic for performing the internet speed test
│       ├── ui.js          # Manages user interface interactions
│       └── utils.js       # Utility functions used across JavaScript files
├── server
│   ├── server.js          # Sets up the Node.js server
│   └── test-files         # Directory for test files/resources
├── .gitignore             # Specifies files to be ignored by Git
├── package.json           # Configuration file for npm
└── README.md              # Documentation for the project
```

## Setup Instructions

1. **Clone the repository**:
   ```
   git clone <repository-url>
   cd internet-speed-checker
   ```

2. **Install dependencies**:
   ```
   npm install
   ```

3. **Run the server**:
   ```
   node server/server.js
   ```

4. **Open your browser** and navigate to `http://localhost:3000` to access the internet speed checker.

## Usage

- Click the "Start Test" button to begin the speed test.
- The application will measure your download and upload speeds and display the results on the screen.

## Contributing

Feel free to submit issues or pull requests if you have suggestions or improvements for the project.

## License

This project is open-source and available under the MIT License.