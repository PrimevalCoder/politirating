// SPDX-License-Identifier: Apache 2.0
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IERC20Token {
  function transfer(address, uint256) external returns (bool);
  function approve(address, uint256) external returns (bool);
  function transferFrom(address, address, uint256) external returns (bool);
  function totalSupply() external view returns (uint256);
  function balanceOf(address) external view returns (uint256);
  function allowance(address, address) external view returns (uint256);

  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract PoliticiansPopularity is Ownable {

    struct Politician {
        string fullName;
        string party;		// the political party
        string shortBio;	// short biography
        string imageURL;
        mapping (address => uint) ratings;	// map containing all user ratings for the given politician
        uint ratingsCount;	// total number of ratings for this politician
        uint ratingsSum;    // the sum of all ratings; we store it in order to compute avgRating in constant time
        uint avgRating;
    }

    mapping (uint => Politician) internal politicians;  // map with all stored 'Politician' entities
    
    
    uint internal politiciansLength = 0; // Size of the 'politicians' mapping; total number of on-chain stored 'Politician' entities.
    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1; 
    

    // Rate a politician
    /*
        _index: the index of the corresponding politician in the 'politicians' map
        _rating: user rating, from 1 to 5; stored multiplied by 100 for precision
    */
    function ratePolitician(uint _index, uint _rating) public payable {
        
        require(1 <= _rating && _rating <= 5, "Rating must be between 1 and 5.");

        
        _rating *= 100;
        
        require(
          IERC20Token(cUsdTokenAddress).transferFrom(
            msg.sender,
            owner(),
            1e18    // user should pay 1 cUSD to give a rating, in order to prevent spam. 
          ),
          "Transfer failed."
        );

        uint prevRating = politicians[_index].ratings[msg.sender]; // default value is 0 if the user didn't rate this politician previously.
        if(prevRating == 0) {
            politicians[_index].ratingsCount++;
        }
        politicians[_index].ratingsSum -= prevRating;   // remove the previous rating and add the new one
        politicians[_index].ratingsSum += _rating;
        politicians[_index].ratings[msg.sender] = _rating;
        politicians[_index].avgRating = politicians[_index].ratingsSum / politicians[_index].ratingsCount;  // we store the average rating, so that we don't have to return all ratings when we query.
        

    }
    
    function getRatingsCount(uint _index) public view returns (uint) {
        return politicians[_index].ratingsCount;
    }

    
    function addPolitician(
        string memory _fullName,
        string memory _party,
        string memory _shortBio,
        string memory _imageURL
    ) public onlyOwner {
            
        require(bytes(_fullName).length > 0, "Enter a non-empty person name.");
        require(bytes(_party).length > 0, "Enter a non-empty party name");
        require(bytes(_imageURL).length > 0, "Enter a non-empty image URL.");
        require(bytes(_shortBio).length > 0, "Enter a non-empty short bio.");
    
        Politician storage p = politicians[politiciansLength++];    // add new Politician to storage and increment the counter
        p.fullName = _fullName;
        p.party = _party;
        p.imageURL = _imageURL;
        p.shortBio = _shortBio;
    }

    function getPolitician(uint _index) public view returns (
        string memory,  // full name 
        string memory,  // party
        string memory,  // short bio
        string memory,  // image URL
        uint,           // ratings count
        uint            // avg rating
    ) {
        
        return (
            politicians[_index].fullName,
            politicians[_index].party,
            politicians[_index].shortBio,
            politicians[_index].imageURL,
            politicians[_index].ratingsCount,
            politicians[_index].avgRating
        );
    }
    
    function getUserRating(uint _index) public view returns (uint) {
        return (politicians[_index].ratings[msg.sender]);
    }
    
    function getPoliticiansLength() public view returns (uint) {
        return (politiciansLength);
    }
}