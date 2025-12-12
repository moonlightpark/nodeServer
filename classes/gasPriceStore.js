const Web3Utils = require('web3-utils'); // web3 util 모듈
const fetch = require("node-fetch"); // api 호출용 모듈

// 실시간 가스 값 가져오는 class
module.exports = class GasPriceStore {
	constructor() {
		this.gasPrices = {};
		this.gasPricesArray = [ // default 값 정의
			{label: 'fast', value: '21'},
			{label: 'fastest', value: '21'},
			{label: 'safeLow', value: '21'},
			{label: 'average', value: '21'},
		];
		this.selectedGasPrice = '22' //
		this.gasPricePromise = null; // promise 함수 호출 할수 있게 선언
		this.getGasPrices() // gas 함수 실행
	}

	/*
	// gasprice.poa.network 값 가져오는 함수
	async getGasPrices(){
		this.gasPricePromise = fetch('https://gasprice.poa.network/').then((response) => {
			return response.json()
		}).then((data) => {
			this.gasPricesArray.map((v) => {
				v.value = data[v.label]
				v.label = `${v.label}: ${data[v.label]} gwei`
				return v;
			})
			this.selectedGasPrice = data.fast;
			this.gasPrices = data;
			console.log(this.gasPricesArray);
			return this.selectedGasPrice;
		}).catch((e) => {
			console.error(e)
		})
	}
	*/
	// ether gas station 값 가져오는 함수
	async getGasPrices(){
		this.gasPricePromise = fetch('https://ethgasstation.info/json/ethgasAPI.json').then((response) => {
			return response.json() // 아래쪽 then 으로 넘기기
		}).then((data) => {
			
			this.gasPricesArray.map((v) => { // 데이터 매핑 하여 gasPricesArray 선언한 규격에 맞게 변경 하여 저장
				var v1	= data[v.label]*0.1 // 값이 80.0 으로 와서 gwei 단위로 바꾸기 위하여 적용 80.0 들어오면 8gwei 가 맞는 값이다.
				v1 = v1.toFixed(1) // 소숫점 한자리만
				v.value = v1
				v.label = `${v.label}: ${v1} gwei`
				return v;
			})
				
			//var v2 = data.safeLow * 0.1;
			//var v2 = data.average * 0.1;
			// 현재 리턴해주는 gas 기준은 fast로 고정
			var v2 = data.fast * 0.1; // 값이 80.0 으로 와서 gwei 단위로 바꾸기 위하여 적용 80.0 들어오면 8gwei 가 맞는 값이다.
			//var v2 = data.fastest * 0.1;
			v2 = v2.toFixed(1); // 소숫점 한자리만
			v2 = parseFloat(v2); // casting
			this.selectedGasPrice = v2; // 전역변수에 저장
			this.gasPrices = data; // 전역변수에 저장
			
/*
			console.log(this.gasPrices);
			console.log(v2);
*/
			
			return this.selectedGasPrice; // return fast gas gwei value
		}).catch((e) => {
			console.error(e)
		})
	}
	
	// selectedGasPrice 값을 Hex 코드로 변환해주는 함수
	async getStandardInHex() {
		const toWei = Web3Utils.toWei(this.selectedGasPrice.toString(), 'gwei')
		return Web3Utils.toHex(toWei)
	}
	
	// selectedGasPrice 변경 하는 함수.
	setSelectedGasPrice(value) {
		this.selectedGasPrice = value;
	}

}