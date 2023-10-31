import React, { useState } from 'react';
import MerkleTree from 'merkletreejs';
import { Buffer } from 'buffer';
import './App.css';
import { keccak256 } from "@ethersproject/keccak256";
import { toUtf8Bytes } from "@ethersproject/strings";

window.Buffer = Buffer;

function App() {
  const [walletAddresses, setWalletAddresses] = useState([]);
  const [root, setRoot] = useState('');
  const [tree, setTree] = useState(null);
  const [addressToCheck, setAddressToCheck] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [manualAddress, setManualAddress] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [leafHashes, setLeafHashes] = useState([]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const addresses = JSON.parse(e.target.result);
          if (Array.isArray(addresses)) {
            setWalletAddresses(addresses);
            setRoot('');
            setTree(null);
            setLeafHashes([]);
          } else {
            alert('Invalid JSON file. The file must contain an array of addresses.');
          }
        } catch (error) {
          alert('Error reading file: ' + error.message);
        }
      };
      reader.readAsText(file);
    }
  };

  const addManualAddress = () => {
    if (manualAddress) {
      if (walletAddresses.includes(manualAddress)) {
        setErrorMessage('This address has already been added.');
      } else {
        setWalletAddresses((prev) => [...prev, manualAddress]);
        setManualAddress('');
        setErrorMessage('');
      }
    }
  };

  const generateMerkleTree = () => {
    const leaves = walletAddresses.map((addr) =>
      keccak256(toUtf8Bytes(addr))
    );
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const root = tree.getRoot().toString('hex');
    setRoot(root);
    setTree(tree);
    setLeafHashes(leaves);
  };
  
  const verifyAddress = () => {
    if (tree && addressToCheck) {
      const leaf = keccak256(toUtf8Bytes(addressToCheck));
      const proof = tree.getHexProof(leaf);
      const isValid = tree.verify(proof, leaf, tree.getRoot());
      setVerificationResult(isValid);
    } else {
      setVerificationResult(null);
    }
  };
  

  const resetAll = () => {
    setWalletAddresses([]);
    setRoot('');
    setTree(null);
    setAddressToCheck('');
    setVerificationResult(null);
    setManualAddress('');
    setErrorMessage('');
    setLeafHashes([]);
  };

  const exportData = () => {
    const data = {
      root,
      leafHashes,
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "merkle_tree_data.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="container">
      <div>
        <input type="file" onChange={handleFileUpload} />
        <input
          className="input"
          type="text"
          value={manualAddress}
          onChange={(e) => setManualAddress(e.target.value)}
          placeholder="Enter wallet address"
        />
        {walletAddresses.length > 0 && (
          <ul>
            {walletAddresses.map((address, index) => (
              <li key={index}>{address}</li>
            ))}
          </ul>
        )}
        <button className="button" onClick={addManualAddress}>
          Add Address
        </button>
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        {walletAddresses.length > 0 && (
          <button className="button" onClick={generateMerkleTree}>
            Generate Merkle Tree
          </button>
        )}
        {leafHashes.length > 0 && (
          <button className="button" onClick={exportData}>
            Export Merkle Tree Data
          </button>
        )}
      </div>
      {root && <div className="root-display">Root: {root}</div>}
      <div>
        <input
          className="input"
          type="text"
          value={addressToCheck}
          onChange={(e) => setAddressToCheck(e.target.value)}
          placeholder="Enter address to verify"
        />
        <button className="button" onClick={verifyAddress}>
          Verify Address
        </button>
      </div>
      <div className="verification-result">
        {verificationResult !== null && (
          <span>{verificationResult ? 'Address is valid!' : 'Address is invalid!'}</span>
          )}
        </div>
        <button className="button reset-button" onClick={resetAll}>Reset All</button>
    </div>
  );
}

export default App;