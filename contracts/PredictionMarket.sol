// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Prediction Market
/// @notice Simple owner-managed binary prediction market with proportional payouts
/// @dev Uses custom errors and follows checks-effects-interactions for safe ETH transfers
contract PredictionMarket {
    // Owner state
    address public owner;
    uint256 private nextMarketId;

    /// @notice Represents a market
    struct Market {
        uint256 id;
        string question;
        uint256 totalYesBets;
        uint256 totalNoBets;
        bool resolved;
        bool winningOutcome; // true = yes wins, false = no wins
    }

    // Custom errors
    error OnlyOwner();
    error MarketDoesNotExist(uint256 id);
    error MarketAlreadyResolved(uint256 id);
    error MarketNotResolved(uint256 id);
    error InvalidBetAmount();
    error AlreadyClaimed(uint256 id, address user);
    error NoWinnings(uint256 id, address user);
    error CannotResolveWithoutBets(uint256 id);
    error TransferFailed();

    // Events
    event MarketCreated(uint256 indexed id, string question);
    event BetPlaced(uint256 indexed id, address indexed bettor, bool outcome, uint256 amount);
    event MarketResolved(uint256 indexed id, bool winningOutcome, uint256 totalYesBets, uint256 totalNoBets);
    event WinningsClaimed(uint256 indexed id, address indexed user, uint256 payout);

    // Storage mappings
    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => uint256)) public yesBets;
    mapping(uint256 => mapping(address => uint256)) public noBets;
    mapping(uint256 => mapping(address => bool)) public hasClaimed;

    // Modifiers
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    constructor() {
        owner = msg.sender;
        nextMarketId = 1;
    }

    /// @notice Create a new market
    /// @param question The market question
    /// @return id The id of the newly created market
    function createMarket(string calldata question) external onlyOwner returns (uint256 id) {
        id = nextMarketId++;
        markets[id] = Market({
            id: id,
            question: question,
            totalYesBets: 0,
            totalNoBets: 0,
            resolved: false,
            winningOutcome: false
        });
        emit MarketCreated(id, question);
    }

    /// @notice Place a bet on "Yes"
    /// @param id The market id
    function betYes(uint256 id) external payable {
        Market storage m = markets[id];
        if (m.id != id) revert MarketDoesNotExist(id);
        if (m.resolved) revert MarketAlreadyResolved(id);
        if (msg.value == 0) revert InvalidBetAmount();

        yesBets[id][msg.sender] += msg.value;
        m.totalYesBets += msg.value;

        emit BetPlaced(id, msg.sender, true, msg.value);
    }

    /// @notice Place a bet on "No"
    /// @param id The market id
    function betNo(uint256 id) external payable {
        Market storage m = markets[id];
        if (m.id != id) revert MarketDoesNotExist(id);
        if (m.resolved) revert MarketAlreadyResolved(id);
        if (msg.value == 0) revert InvalidBetAmount();

        noBets[id][msg.sender] += msg.value;
        m.totalNoBets += msg.value;

        emit BetPlaced(id, msg.sender, false, msg.value);
    }

    /// @notice Resolve a market with the winning outcome
    /// @param id The market id
    /// @param winningOutcome True if "Yes" wins, false if "No" wins
    function resolveMarket(uint256 id, bool winningOutcome) external onlyOwner {
        Market storage m = markets[id];
        if (m.id != id) revert MarketDoesNotExist(id);
        if (m.resolved) revert MarketAlreadyResolved(id);
        if (m.totalYesBets == 0 && m.totalNoBets == 0) revert CannotResolveWithoutBets(id);

        m.resolved = true;
        m.winningOutcome = winningOutcome;

        emit MarketResolved(id, winningOutcome, m.totalYesBets, m.totalNoBets);
    }

    /// @notice Claim winnings based on your bets and the resolved outcome
    /// @param id The market id
    function claim(uint256 id) external {
        Market storage m = markets[id];
        if (m.id != id) revert MarketDoesNotExist(id);
        if (!m.resolved) revert MarketNotResolved(id);
        if (hasClaimed[id][msg.sender]) revert AlreadyClaimed(id, msg.sender);

        uint256 userWinAmount;
        uint256 winnersPool;
        uint256 losersPool;

        if (m.winningOutcome) {
            userWinAmount = yesBets[id][msg.sender];
            winnersPool = m.totalYesBets;
            losersPool = m.totalNoBets;
        } else {
            userWinAmount = noBets[id][msg.sender];
            winnersPool = m.totalNoBets;
            losersPool = m.totalYesBets;
        }

        if (userWinAmount == 0) revert NoWinnings(id, msg.sender);

        // Payout calculation: original stake + proportional share of losing pool
        // This ensures the contract always has enough funds for all winners
        uint256 payout = userWinAmount + (userWinAmount * losersPool / winnersPool);

        // Effects
        hasClaimed[id][msg.sender] = true;

        // Interaction
        (bool ok, ) = payable(msg.sender).call{value: payout}("");
        if (!ok) revert TransferFailed();

        emit WinningsClaimed(id, msg.sender, payout);
    }

    /// @notice Get a market by id
    function getMarket(uint256 id) external view returns (Market memory) {
        Market memory m = markets[id];
        if (m.id != id) revert MarketDoesNotExist(id);
        return m;
    }

    /// @notice Get user bet amounts and claim status for a market
    function getUserBets(uint256 id, address user) external view returns (uint256 yesAmount, uint256 noAmount, bool claimed) {
        Market memory m = markets[id];
        if (m.id != id) revert MarketDoesNotExist(id);
        yesAmount = yesBets[id][user];
        noAmount = noBets[id][user];
        claimed = hasClaimed[id][user];
    }
}