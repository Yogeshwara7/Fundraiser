// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.26;

contract camp {
    address[] private campers;

    event campcreated(
        string Title,
        uint RequiredAmount,
        address indexed owner,
        address campaddress,
        string campImage,
        uint indexed timestamp,
        string category
    );

    function createcamp(
        string calldata campTitle,
        uint RequiredcampAmount,
        string calldata campImage,
        string calldata campStory,
        string calldata campcategory
    ) external {
        Pro newPro = new Pro(
            campTitle,
            RequiredcampAmount,
            campImage,
            campStory,
            msg.sender
        );

        emit campcreated(
            campTitle,
            RequiredcampAmount,
            msg.sender,
            address(newPro),
            campImage,
            block.timestamp,
            campcategory
        );

        campers.push(address(newPro));
    }

    function getAllCampaigns() external view returns (address[] memory) {
        return campers;
    }
}

contract Pro {
    string public Title;
    string public Image;
    string public Story;
    uint public immutable RequiredAmount;  // ✅ immutable saves gas
    address payable public immutable owner;

    uint public ReceivedAmount;

    event donated(
        address indexed donar,
        uint indexed Amount,
        uint indexed timestamp
    );

    constructor(
        string memory _Title,
        uint _RequiredAmount,
        string memory _Image,
        string memory _Story,
        address campaignOwner
    ) {
        Title = _Title;
        RequiredAmount = _RequiredAmount * 1 ether;
        Image = _Image;
        Story = _Story;
        owner = payable(campaignOwner);
    }

    function donate() external payable {
        require(
            ReceivedAmount < RequiredAmount,
            "Required Amount has been fulfilled"
        );

        owner.transfer(msg.value);
        ReceivedAmount += msg.value;

        emit donated(msg.sender, msg.value, block.timestamp);
    }
}
