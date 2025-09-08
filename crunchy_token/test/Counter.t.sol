// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {CrunchyToken} from "../src/Counter.sol";

contract CrunchyTokenTest is Test {
    CrunchyToken public token;
    address public owner;
    address public user1;
    address public user2;
    address public vendor1;
    address public vendor2;

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        vendor1 = address(0x3);
        vendor2 = address(0x4);
        
        token = new CrunchyToken(owner);
        
        // Authorize vendors
        token.setVendorAuthorization(vendor1, true);
        token.setVendorAuthorization(vendor2, true);
    }

    function test_InitialState() public {
        assertEq(token.name(), "CrunchyToken");
        assertEq(token.symbol(), "CRNCH");
        assertEq(token.decimals(), 18);
        assertEq(token.totalSupply(), 0);
        assertEq(token.defaultMintAmount(), 100 * 10**18);
        assertTrue(token.authorizedVendors(vendor1));
        assertTrue(token.authorizedVendors(vendor2));
    }

    function test_MintFromQRCode() public {
        string memory qrHash = "QR123456";
        uint256 expectedAmount = 100 * 10**18; // Default amount
        
        vm.prank(user1);
        token.mintFromQRCode(qrHash, 0); // 0 means use default amount
        
        assertEq(token.balanceOf(user1), expectedAmount);
        assertEq(token.totalSupply(), expectedAmount);
        assertTrue(token.isQRCodeUsed(qrHash));
    }

    function test_MintFromQRCodeCustomAmount() public {
        string memory qrHash = "QR789012";
        uint256 customAmount = 50 * 10**18;
        
        vm.prank(user1);
        token.mintFromQRCode(qrHash, customAmount);
        
        assertEq(token.balanceOf(user1), customAmount);
        assertEq(token.totalSupply(), customAmount);
        assertTrue(token.isQRCodeUsed(qrHash));
    }

    function test_MintFromQRCodeWithPresetValue() public {
        string memory qrHash = "QR345678";
        uint256 presetValue = 200 * 10**18;
        
        // Owner sets a specific value for this QR code
        token.setQRCodeValue(qrHash, presetValue);
        
        vm.prank(user1);
        token.mintFromQRCode(qrHash, 0); // Use preset value
        
        assertEq(token.balanceOf(user1), presetValue);
        assertEq(token.getQRCodeValue(qrHash), presetValue);
    }

    function test_CannotReuseQRCode() public {
        string memory qrHash = "QR111111";
        
        vm.prank(user1);
        token.mintFromQRCode(qrHash, 0);
        
        // Try to use the same QR code again
        vm.prank(user2);
        vm.expectRevert("QR code already used");
        token.mintFromQRCode(qrHash, 0);
    }

    function test_PurchaseSnack() public {
        string memory qrHash = "QR222222";
        uint256 mintAmount = 100 * 10**18;
        uint256 purchaseAmount = 30 * 10**18;
        
        // First mint tokens
        vm.prank(user1);
        token.mintFromQRCode(qrHash, mintAmount);
        
        // Purchase snack
        vm.prank(user1);
        token.purchaseSnack(vendor1, purchaseAmount, "chips001");
        
        assertEq(token.balanceOf(user1), mintAmount - purchaseAmount);
        assertEq(token.balanceOf(vendor1), purchaseAmount);
    }

    function test_CannotPurchaseFromUnauthorizedVendor() public {
        string memory qrHash = "QR333333";
        address unauthorizedVendor = address(0x5);
        
        vm.prank(user1);
        token.mintFromQRCode(qrHash, 0);
        
        vm.prank(user1);
        vm.expectRevert("Vendor not authorized");
        token.purchaseSnack(unauthorizedVendor, 10 * 10**18, "snack001");
    }

    function test_CannotPurchaseWithInsufficientBalance() public {
        string memory qrHash = "QR444444";
        uint256 mintAmount = 50 * 10**18;
        uint256 purchaseAmount = 100 * 10**18; // More than minted
        
        vm.prank(user1);
        token.mintFromQRCode(qrHash, mintAmount);
        
        vm.prank(user1);
        vm.expectRevert("Insufficient token balance");
        token.purchaseSnack(vendor1, purchaseAmount, "expensive_snack");
    }

    function test_SetDefaultMintAmount() public {
        uint256 newAmount = 250 * 10**18;
        token.setDefaultMintAmount(newAmount);
        assertEq(token.defaultMintAmount(), newAmount);
        
        // Test with new default
        string memory qrHash = "QR555555";
        vm.prank(user1);
        token.mintFromQRCode(qrHash, 0);
        assertEq(token.balanceOf(user1), newAmount);
    }

    function test_OnlyOwnerCanSetDefaultMintAmount() public {
        vm.prank(user1);
        vm.expectRevert();
        token.setDefaultMintAmount(200 * 10**18);
    }

    function test_SetMultipleVendorAuthorization() public {
        address[] memory vendors = new address[](2);
        vendors[0] = address(0x6);
        vendors[1] = address(0x7);
        
        token.setMultipleVendorAuthorization(vendors, true);
        
        assertTrue(token.authorizedVendors(vendors[0]));
        assertTrue(token.authorizedVendors(vendors[1]));
    }

    function test_ResetQRCode() public {
        string memory qrHash = "QR666666";
        
        // Use QR code
        vm.prank(user1);
        token.mintFromQRCode(qrHash, 0);
        assertTrue(token.isQRCodeUsed(qrHash));
        
        // Reset QR code (only owner)
        token.resetQRCode(qrHash);
        assertFalse(token.isQRCodeUsed(qrHash));
        
        // Can use again
        vm.prank(user2);
        token.mintFromQRCode(qrHash, 0);
        assertEq(token.balanceOf(user2), 100 * 10**18);
    }

    function test_OnlyOwnerCanResetQRCode() public {
        string memory qrHash = "QR777777";
        
        vm.prank(user1);
        token.mintFromQRCode(qrHash, 0);
        
        vm.prank(user1);
        vm.expectRevert();
        token.resetQRCode(qrHash);
    }

    function test_EmptyQRCodeHashReverts() public {
        vm.prank(user1);
        vm.expectRevert("QR code hash cannot be empty");
        token.mintFromQRCode("", 0);
    }

    function test_ZeroAmountMintReverts() public {
        // Set default to 0 to test this case
        token.setDefaultMintAmount(1); // Set to 1 first
        token.setQRCodeValue("QR888888", 0); // This should revert
        
        vm.expectRevert("Value must be greater than 0");
        token.setQRCodeValue("QR888888", 0);
    }

    function test_TransferFunctionality() public {
        string memory qrHash = "QR999999";
        uint256 amount = 100 * 10**18;
        
        // Mint tokens
        vm.prank(user1);
        token.mintFromQRCode(qrHash, amount);
        
        // Transfer tokens
        vm.prank(user1);
        token.transfer(user2, 30 * 10**18);
        
        assertEq(token.balanceOf(user1), 70 * 10**18);
        assertEq(token.balanceOf(user2), 30 * 10**18);
    }

    function test_Events() public {
        string memory qrHash = "QR000000";
        uint256 amount = 100 * 10**18;
        
        // Test TokensMinted event
        vm.expectEmit(true, false, false, true);
        emit CrunchyToken.TokensMinted(user1, amount, qrHash);
        
        vm.prank(user1);
        token.mintFromQRCode(qrHash, amount);
        
        // Test SnackPurchased event
        vm.expectEmit(true, true, false, true);
        emit CrunchyToken.SnackPurchased(user1, vendor1, 20 * 10**18, "cookie001");
        
        vm.prank(user1);
        token.purchaseSnack(vendor1, 20 * 10**18, "cookie001");
    }
}
