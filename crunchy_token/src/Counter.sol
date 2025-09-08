// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract CrunchyToken is ERC20, Ownable, ReentrancyGuard {
    // Events
    event TokensMinted(address indexed user, uint256 amount, string qrCodeHash);
    event SnackPurchased(address indexed buyer, address indexed vendor, uint256 amount, string snackId);
    event QRCodeUsed(string qrCodeHash, address indexed user);
    
    // Mapping to track used QR codes to prevent double spending
    mapping(string => bool) public usedQRCodes;
    mapping(string => uint256) public qrCodeValues;
    
    // Mapping to track authorized vendors
    mapping(address => bool) public authorizedVendors;
    
    // Default mint amount per QR code (can be customized per QR)
    uint256 public defaultMintAmount = 100 * 10**18; // 100 tokens
    
    constructor(address initialOwner) ERC20("CrunchyToken", "CRNCH") Ownable(initialOwner) {
        // No initial supply - tokens are minted only via QR codes
    }
    
    /**
     * @dev Mint tokens by scanning QR code
     * @param qrCodeHash Unique hash of the QR code
     * @param amount Amount of tokens to mint (0 means use default)
     */
    function mintFromQRCode(string memory qrCodeHash, uint256 amount) external nonReentrant {
        require(bytes(qrCodeHash).length > 0, "QR code hash cannot be empty");
        require(!usedQRCodes[qrCodeHash], "QR code already used");
        
        uint256 mintAmount = amount;
        if (amount == 0) {
            // Use predefined amount for this QR code, or default
            mintAmount = qrCodeValues[qrCodeHash] > 0 ? qrCodeValues[qrCodeHash] : defaultMintAmount;
        }
        
        require(mintAmount > 0, "Mint amount must be greater than 0");
        
        // Mark QR code as used
        usedQRCodes[qrCodeHash] = true;
        
        // Mint tokens to the user
        _mint(msg.sender, mintAmount);
        
        emit TokensMinted(msg.sender, mintAmount, qrCodeHash);
        emit QRCodeUsed(qrCodeHash, msg.sender);
    }
    
    /**
     * @dev Spend tokens to purchase snacks
     * @param vendor Address of the snack vendor
     * @param amount Amount of tokens to spend
     * @param snackId Identifier of the snack being purchased
     */
    function purchaseSnack(address vendor, uint256 amount, string memory snackId) external nonReentrant {
        require(vendor != address(0), "Invalid vendor address");
        require(authorizedVendors[vendor], "Vendor not authorized");
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient token balance");
        
        // Transfer tokens from buyer to vendor
        _transfer(msg.sender, vendor, amount);
        
        emit SnackPurchased(msg.sender, vendor, amount, snackId);
    }
    
    /**
     * @dev Owner function to set QR code values
     * @param qrCodeHash Hash of the QR code
     * @param value Token value for this QR code
     */
    function setQRCodeValue(string memory qrCodeHash, uint256 value) external onlyOwner {
        require(bytes(qrCodeHash).length > 0, "QR code hash cannot be empty");
        require(value > 0, "Value must be greater than 0");
        qrCodeValues[qrCodeHash] = value;
    }
    
    /**
     * @dev Owner function to set default mint amount
     * @param amount New default mint amount
     */
    function setDefaultMintAmount(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        defaultMintAmount = amount;
    }
    
    /**
     * @dev Owner function to authorize vendors
     * @param vendor Address of the vendor
     * @param authorized Whether the vendor is authorized
     */
    function setVendorAuthorization(address vendor, bool authorized) external onlyOwner {
        require(vendor != address(0), "Invalid vendor address");
        authorizedVendors[vendor] = authorized;
    }
    
    /**
     * @dev Owner function to authorize multiple vendors at once
     * @param vendors Array of vendor addresses
     * @param authorized Whether the vendors are authorized
     */
    function setMultipleVendorAuthorization(address[] memory vendors, bool authorized) external onlyOwner {
        for (uint256 i = 0; i < vendors.length; i++) {
            require(vendors[i] != address(0), "Invalid vendor address");
            authorizedVendors[vendors[i]] = authorized;
        }
    }
    
    /**
     * @dev Check if a QR code has been used
     * @param qrCodeHash Hash of the QR code to check
     */
    function isQRCodeUsed(string memory qrCodeHash) external view returns (bool) {
        return usedQRCodes[qrCodeHash];
    }
    
    /**
     * @dev Get the value assigned to a specific QR code
     * @param qrCodeHash Hash of the QR code
     */
    function getQRCodeValue(string memory qrCodeHash) external view returns (uint256) {
        return qrCodeValues[qrCodeHash] > 0 ? qrCodeValues[qrCodeHash] : defaultMintAmount;
    }
    
    /**
     * @dev Emergency function to reset a QR code (only owner)
     * @param qrCodeHash Hash of the QR code to reset
     */
    function resetQRCode(string memory qrCodeHash) external onlyOwner {
        usedQRCodes[qrCodeHash] = false;
    }
    
    /**
     * @dev Override transfer to add additional logging for snack purchases
     */
    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        return super.transfer(to, amount);
    }
    
    /**
     * @dev Override transferFrom to add additional logging
     */
    function transferFrom(address from, address to, uint256 amount) public virtual override returns (bool) {
        return super.transferFrom(from, to, amount);
    }
}
