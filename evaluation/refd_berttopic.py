import pandas as pd
import warnings
# warnings.filterwarnings("ignore", 'This pattern has match groups')
# from sklearn.model_selection import train_test_split
from sklearn.metrics import precision_score, recall_score, f1_score,accuracy_score
# import numpy as np
# from keras.layers import *
# from keras.models import Sequential , Model 
# import pickle
# import os
# from keras.saving import load_model
import numpy as np
import pandas as pd
import ast




class RefD:
    def __init__(self):
        self.data = pd.read_csv("evaluation\\result_files\\clean_data_simple_datamining.csv", index_col=0)
        related_relationships = pd.read_csv("evaluation\\result_files\\related_relationships_datamining.csv", index_col=0)
        self.related_relationships = related_relationships.drop_duplicates()

        df = pd.read_csv("evaluation\\truth_files\\data_mining_relation_v2.csv",delimiter="\t",header=None)
        df = df.rename(columns={0: "name", 1: "related_to",2:"score_real"})
        self.related_relationships = pd.merge(df,self.related_relationships, on=["name","related_to"])
        print(self.related_relationships["score_real"])
        real_1 = self.related_relationships["score_real"].replace(-1, 0)
        real_2 = self.related_relationships["score_real"].replace(1,0).replace(-1,1)
        real = pd.concat([real_1,real_2],ignore_index=True)
        real = real.values
        print(real)
        result = []

        for theta  in range(0, 200, 1):
            theta = theta / 100
            print(theta)
            preq1 = []
            preq2 = []

            for _,r in self.related_relationships.iterrows():
                c1 = r["name"]
                c2 = r["related_to"]
                # a,b = self.refD(c1,c2,theta) 
                a,b =self.berttopic(c1,c2,theta)
                preq1.append(a)
                preq2.append(b)

                    
            ser = preq1 + preq2
            
            accuracy = accuracy_score(real,ser)
            precision = precision_score(real,ser,average='binary', zero_division=1)
            recall = recall_score(real,ser,average='binary', zero_division=1)
            f1 = f1_score(real,ser,average='binary', zero_division=1)


            metrics_dict = {
            'theta': theta,
            'precision': precision,
            'recall': recall,
            "f1":f1,
            "accuracy": accuracy
            }
            result.append(metrics_dict)
        result = pd.DataFrame.from_dict(result)
        result.to_csv("berttopic_result.csv")

    
    


    def refD(self,c1,c2,theta):
            try:
                w_c_a = self.data["article_contents"].loc[self.data['name'] == c1].iloc[0]
                w_c_a = ast.literal_eval(w_c_a)
            except:
                w_c_a =  ast.literal_eval([])
            try:
                w_c_b = self.data["article_contents"].loc[self.data['name'] == c2].iloc[0]
                w_c_b =  ast.literal_eval(w_c_b)
            except:
                w_c_b = ast.literal_eval([])
            r_c_a = self.data["name"].loc[self.data["article_contents"].str.contains(c1)].to_list()
            r_c_b = self.data["name"].loc[self.data["article_contents"].str.contains(c2)].to_list()


            if len(w_c_a) == 0:
                eq1 = 0
            else:
                eq1 = len([x for x in w_c_a if x in r_c_b])/len(w_c_a)

            if len(w_c_b) == 0:
                eq2 = 0
            else:
                eq2 = len([x for x in w_c_b if x in r_c_a])/len(w_c_b)

            
            ref_d = eq1 - eq2
            if ref_d > theta:
                return 0,1
            elif ref_d < -theta:
                return 1,0
            return 0,0


    def berttopic(self,c1,c2,theta):
        #if c1's entropy is higher than c2's then c1 is a prerequisite of c2
        c1_entropy = self.data["entropy"].loc[self.data['name'] == c1].iloc[0]
        c2_entropy = self.data["entropy"].loc[self.data['name'] == c2].iloc[0]
        delta = c1_entropy - c2_entropy
        print(delta)

        if delta > theta:
            return 0,1
        elif delta < -theta:
            return 1,0
        return 0,0


# def science():  
#     df = pd.read_csv("evaluation\\result_files\\prerequisite_relationships_science.csv",index_col=0)
#     df = df[["prerequisite_concept","concept","score_weighted","score_unweighted","coursemapper_channel_1_weighted","coursemapper_channel_2_weighted"]]
#     df = df[(df["coursemapper_channel_1_weighted"] == 1) |(df["coursemapper_channel_2_weighted"] == 1)]
#     df.to_csv("djafdf.csv")

RefD() 