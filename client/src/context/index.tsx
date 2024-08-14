import React, { useContext, createContext, ReactNode } from "react";
import {
  useAddress,
  useContract,
  useContractWrite,
  useConnect,
  metamaskWallet,
} from "@thirdweb-dev/react";
import { ethers } from "ethers";
import { EditionMetadataWithOwnerOutputSchema } from "@thirdweb-dev/sdk";
import { SmartContract } from "@thirdweb-dev/sdk";

interface Campaign {
  owner: string;
  title: string;
  description: string;
  target: string;
  deadline: number;
  amountCollected: string;
  image: string;
  pId: number;
}

interface Donation {
  donator: string;
  donation: string;
}

interface CampaignFormData {
  title: string;
  description: string;
  target: string;
  deadline: string;
  image: string;
}

interface StateContextType {
  address: string | undefined;
  contract: SmartContract | undefined;
  connect: () => Promise<void>;
  createCampaign: (form: CampaignFormData) => Promise<void>;
  getCampaigns: () => Promise<Campaign[]>;
  getUserCampaigns: () => Promise<Campaign[]>;
  donate: (pId: number, amount: string) => Promise<unknown>;
  getDonations: (pId: number) => Promise<Donation[]>;
}

const StateContext = createContext<StateContextType | undefined>(undefined);

const metamaskConfig = metamaskWallet();

export const StateContextProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { contract } = useContract(
    "0x1F49ad091A1bC58ec754883cE834d9D3f53D69b5"
  );
  const { mutateAsync: createCampaign } = useContractWrite(
    contract,
    "createCampaign"
  );
  const address = useAddress();
  const connect = useConnect();

  const connectWallet = async () => {
    try {
      await connect(metamaskConfig);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const publishCampaign = async (form: CampaignFormData): Promise<void> => {
    try {
      const data = await createCampaign({
        args: [
          address, // owner
          form.title, // title
          form.description, // description
          form.target,
          new Date(form.deadline).getTime(), // deadline,
          form.image,
        ],
      });
      console.log("contract call success", data);
    } catch (error) {
      console.log("contract call failure", error);
    }
  };

  const getCampaigns = async (): Promise<Campaign[]> => {
    const campaigns = await contract!.call("getCampaigns");
    const parsedCampaings: Campaign[] = campaigns.map(
      (campaign: any, i: number) => ({
        owner: campaign.owner,
        title: campaign.title,
        description: campaign.description,
        target: ethers.utils.formatEther(campaign.target.toString()),
        deadline: campaign.deadline.toNumber(),
        amountCollected: ethers.utils.formatEther(
          campaign.amountCollected.toString()
        ),
        image: campaign.image,
        pId: i,
      })
    );
    return parsedCampaings;
  };

  const getUserCampaigns = async (): Promise<Campaign[]> => {
    const allCampaigns = await getCampaigns();
    const filteredCampaigns = allCampaigns.filter(
      (campaign) => campaign.owner === address
    );
    return filteredCampaigns;
  };

  const donate = async (pId: number, amount: string): Promise<unknown> => {
    const data = await contract!.call("donateToCampaign", [pId], {
      value: ethers.utils.parseEther(amount),
    });
    return data;
  };

  const getDonations = async (pId: number): Promise<Donation[]> => {
    const donations = await contract!.call("getDonators", [pId]);
    const numberOfDonations = donations[0].length;
    const parsedDonations: Donation[] = [];
    for (let i = 0; i < numberOfDonations; i++) {
      parsedDonations.push({
        donator: donations[0][i],
        donation: ethers.utils.formatEther(donations[1][i].toString()),
      });
    }
    return parsedDonations;
  };

  return (
    <StateContext.Provider
      value={{
        address,
        contract,
        connect: connectWallet,
        createCampaign: publishCampaign,
        getCampaigns,
        getUserCampaigns,
        donate,
        getDonations,
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = (): StateContextType => {
  const context = useContext(StateContext);
  if (context === undefined) {
    throw new Error(
      "useStateContext must be used within a StateContextProvider"
    );
  }
  return context;
};
