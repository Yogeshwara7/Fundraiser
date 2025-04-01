
// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.26;

contract camp{
    address[] public camper;
    event campcreated(
    string Title,
    uint RequiredAmount,
    address indexed owner,
    address campaddress,
    string  campImage,
    uint indexed timestamp,
    string  category) ;

    function createcamp (
        string memory campTitle,
        uint RequiredcampAmount,
        string memory campImage,
        string memory campStory,
        string memory campcategory) public {


        Pro newPro = new Pro(campTitle,RequiredcampAmount,campImage,campStory,msg.sender);
        emit campcreated(campTitle, RequiredcampAmount, msg.sender, address(newPro), campImage, block.timestamp, campcategory);

    camper.push(address(newPro));
    }
}

contract Pro {
    string public Title;
    uint public RequiredAmount;
    string public Image;
    string public Story;
    address payable public  owner;
    uint public ReceivedAmount;
    event donated(address indexed donar,
    uint indexed Amount,
    uint indexed timestamp);

    constructor (string memory _Title,uint _RequiredAmount,string memory _Image,string memory _Story,address campaignOwner){
        Title = _Title;
        RequiredAmount = _RequiredAmount*10**18;  // RequiredAmount in Wei (Weth)
        Image  =_Image ;
        Story=_Story;
        owner = payable(campaignOwner);   
    }

    function donate() public payable{
        require(RequiredAmount > ReceivedAmount, "Required Amount has been Fulfilled");
        owner.transfer(msg.value);
        ReceivedAmount += msg.value; // add the donated amount to received amount
        emit donated(msg.sender, msg.value,block.timestamp);
    }

    
}