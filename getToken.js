// 토큰 정보를 조회하는 모듈
module.exports = class GetToken{
	constructer(constants){ // 상위단에서 선헌한 상수들을 인자로 받는다.
		this.constants = constants; // constants 내부함수로 선언
	}

	async getTokenDecimals(web3Instance, tokenAddress) { // getWeb3 로 정의한 web3Instance 를 받아서 쓴다.
	  const web3 = new Web3(web3Instance.currentProvider); // web3 생성
	  const token = new web3.eth.Contract(this.constants.ERC20ABI(), tokenAddress); // token contract 호출
	  return await token.methods.decimals().call(); // token contract 의 decimals() method 호출 하여 리턴
	}
};