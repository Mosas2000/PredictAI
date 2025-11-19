pragma solidity ^0.8.20;

// Simple Greeter contract for testing deployments
contract Greeter {
    string private greeting;

    event GreetingChanged(string oldGreeting, string newGreeting);

    constructor(string memory _greeting) {
        greeting = _greeting;
    }

    function greet() public view returns (string memory) {
        return greeting;
    }

    function setGreeting(string memory _greeting) public {
        string memory old = greeting;
        greeting = _greeting;
        emit GreetingChanged(old, _greeting);
    }
}